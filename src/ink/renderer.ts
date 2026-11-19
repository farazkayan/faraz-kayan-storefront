/**
 * Adapted from Codemure's ink-bleed-theme-changer (MIT License, Copyright (c) 2026 Codemure)
 * https://github.com/codemure-official/ink-bleed-theme-changer
 */
import type { ThemeMode } from '../utils/theme';
import type { Snapshot } from './capture';
import { createNoiseTexture } from './noiseTexture';
import { inkParams, RIM_COLOR } from './params';
import { createProgram, type Program } from './program';
import { FULLSCREEN_VERT, INK_FRAG } from './shaders';

interface ThemeTexture {
  texture: WebGLTexture;
  width: number;
  height: number;
  scale: number;
  key: string;
}

/** Offscreen copy of what the overlay showed when a transition was interrupted. */
interface CompositeTexture {
  texture: WebGLTexture;
  framebuffer: WebGLFramebuffer;
  width: number;
  height: number;
  /** Page scroll (CSS px) at the moment it was rendered. */
  scrollX: number;
  scrollY: number;
}

/** What the ink spreads *over*: a theme snapshot, or the frozen mid-transition frame. */
export type InkSource = ThemeMode | 'composite';

export interface InkFrame {
  from: InkSource;
  to: ThemeMode;
  /** Click point, CSS px relative to the viewport. */
  center: { x: number; y: number };
  /** Eased 0..1. */
  progress: number;
  /** Base radius, CSS px. */
  radius: number;
  /** Uniform extra reach used to finish off lagging corners, CSS px. */
  cleanup: number;
  /** Distance from the click to the farthest viewport corner, CSS px. */
  maxDist: number;
  /** Seconds since the click. */
  time: number;
  /** Per-click randomness. */
  seed: { x: number; y: number; angle: number };
}

interface Sampler {
  texture: WebGLTexture;
  width: number;
  height: number;
  /** Texture px per canvas device px. */
  ratio: number;
  /** Texture px added after scaling (scroll), already rounded to whole texels. */
  offsetX: number;
  offsetY: number;
  /** True for framebuffer-rendered sources (GL's bottom-up Y vs. canvas top-down Y). */
  flipY: boolean;
}

export class InkRenderer {
  readonly canvas: HTMLCanvasElement;
  readonly maxTextureSize: number;

  private readonly gl: WebGL2RenderingContext;
  private program!: Program;
  private vao!: WebGLVertexArrayObject;
  private noise!: WebGLTexture;
  private readonly textures = new Map<ThemeMode, ThemeTexture>();
  private composites: CompositeTexture[] = [];
  private activeComposite = -1;
  private canvasScale = 1;
  private lost = false;
  private disposed = false;
  private contextLostHandler: ((e: Event) => void) | null = null;
  private contextRestoredHandler: (() => void) | null = null;

  /** Returns null when WebGL2 is unavailable or shader compilation fails. */
  static create(canvas: HTMLCanvasElement): InkRenderer | null {
    let gl: WebGL2RenderingContext | null = null;
    try {
      gl = canvas.getContext('webgl2', {
        alpha: false, // opaque: CSS opacity fades it straight onto the live DOM
        antialias: false,
        depth: false,
        stencil: false,
        premultipliedAlpha: false,
        preserveDrawingBuffer: false,
        powerPreference: 'high-performance',
      });
    } catch {
      return null;
    }
    if (!gl) return null;
    try {
      return new InkRenderer(canvas, gl);
    } catch {
      return null;
    }
  }

  private constructor(canvas: HTMLCanvasElement, gl: WebGL2RenderingContext) {
    this.canvas = canvas;
    this.gl = gl;
    this.maxTextureSize = (gl.getParameter(gl.MAX_TEXTURE_SIZE) as number) || 4096;
    this.init();
  }

  private init(): void {
    const gl = this.gl;
    this.program = createProgram(gl, FULLSCREEN_VERT, INK_FRAG);
    const vao = gl.createVertexArray();
    if (!vao) throw new Error('createVertexArray failed');
    this.vao = vao;
    this.noise = createNoiseTexture(gl);
    this.composites = [];
    this.activeComposite = -1;
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
  }

  /** Context loss/restore hooks. `onRestored` should re-upload snapshots. */
  watchContext(onLost: () => void, onRestored: () => void): void {
    this.unwatchContext();
    this.contextLostHandler = (e: Event) => {
      e.preventDefault();
      this.lost = true;
      this.textures.clear();
      this.composites = [];
      this.activeComposite = -1;
      onLost();
    };
    this.contextRestoredHandler = () => {
      if (this.disposed) return;
      this.lost = false;
      try {
        this.init();
        onRestored();
      } catch {
        this.lost = true;
      }
    };
    this.canvas.addEventListener('webglcontextlost', this.contextLostHandler);
    this.canvas.addEventListener(
      'webglcontextrestored',
      this.contextRestoredHandler
    );
  }

  private unwatchContext(): void {
    if (this.contextLostHandler) {
      this.canvas.removeEventListener(
        'webglcontextlost',
        this.contextLostHandler
      );
      this.contextLostHandler = null;
    }
    if (this.contextRestoredHandler) {
      this.canvas.removeEventListener(
        'webglcontextrestored',
        this.contextRestoredHandler
      );
      this.contextRestoredHandler = null;
    }
  }

  get isLost(): boolean {
    return this.lost || this.disposed;
  }

  /** Sizes the backing store to the overlay's CSS box at the given DPR. */
  resize(scale: number): void {
    if (this.disposed) return;
    const rect = this.canvas.getBoundingClientRect();
    const cssWidth = rect.width > 0 ? rect.width : window.innerWidth;
    const cssHeight = rect.height > 0 ? rect.height : window.innerHeight;
    const w = Math.max(1, Math.round(cssWidth * scale));
    const h = Math.max(1, Math.round(cssHeight * scale));
    if (this.canvas.width !== w) this.canvas.width = w;
    if (this.canvas.height !== h) this.canvas.height = h;
    this.canvasScale = cssWidth > 0 ? w / cssWidth : scale;
  }

  upload(snapshot: Snapshot): void {
    if (this.isLost) return;
    const gl = this.gl;
    let entry = this.textures.get(snapshot.theme);
    if (!entry) {
      entry = {
        texture: this.createTexture(),
        width: 0,
        height: 0,
        scale: 0,
        key: '',
      };
      this.textures.set(snapshot.theme, entry);
    }
    gl.bindTexture(gl.TEXTURE_2D, entry.texture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA8,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      snapshot.canvas
    );
    entry.width = snapshot.canvas.width;
    entry.height = snapshot.canvas.height;
    entry.scale = snapshot.scale;
    entry.key = snapshot.key;
  }

  /** True when a snapshot for `theme` exists and matches the current layout. */
  hasValid(theme: ThemeMode, key: string): boolean {
    return !this.isLost && this.textures.get(theme)?.key === key;
  }

  /**
   * Renders `frame` (normally: exactly what is on screen) into an offscreen texture that
   * later frames can use as `from: 'composite'`. Two textures ping-pong, so a frame that
   * itself reads the composite can be frozen again (rapid triple-clicks).
   */
  freeze(frame: InkFrame): boolean {
    if (this.isLost) return false;
    const gl = this.gl;
    const index = this.activeComposite === 0 ? 1 : 0;
    const target = this.ensureComposite(index);
    gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
    const ok = this.render(frame);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    if (!ok) return false;
    target.scrollX = window.scrollX;
    target.scrollY = window.scrollY;
    this.activeComposite = index;
    return true;
  }

  draw(frame: InkFrame): void {
    if (this.isLost) return;
    this.render(frame);
  }

  /** Release all GPU resources and event listeners cleanly. */
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.unwatchContext();
    const gl = this.gl;
    if (!gl.isContextLost()) {
      for (const entry of this.textures.values()) {
        gl.deleteTexture(entry.texture);
      }
      for (const comp of this.composites) {
        if (comp) {
          gl.deleteTexture(comp.texture);
          gl.deleteFramebuffer(comp.framebuffer);
        }
      }
      if (this.noise) gl.deleteTexture(this.noise);
      if (this.vao) gl.deleteVertexArray(this.vao);
      if (this.program) gl.deleteProgram(this.program.program);
    }
    this.textures.clear();
    this.composites = [];
    this.activeComposite = -1;
  }

  // ---------- internals ----------

  private createTexture(): WebGLTexture {
    const gl = this.gl;
    const texture = gl.createTexture();
    if (!texture) throw new Error('createTexture failed');
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return texture;
  }

  private ensureComposite(index: number): CompositeTexture {
    const gl = this.gl;
    const { width, height } = this.canvas;
    let c = this.composites[index];
    if (!c) {
      const framebuffer = gl.createFramebuffer();
      if (!framebuffer) throw new Error('createFramebuffer failed');
      c = {
        texture: this.createTexture(),
        framebuffer,
        width: 0,
        height: 0,
        scrollX: 0,
        scrollY: 0,
      };
      this.composites[index] = c;
    }
    if (c.width !== width || c.height !== height) {
      gl.bindTexture(gl.TEXTURE_2D, c.texture);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA8,
        width,
        height,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        null
      );
      gl.bindFramebuffer(gl.FRAMEBUFFER, c.framebuffer);
      gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        c.texture,
        0
      );
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      c.width = width;
      c.height = height;
    }
    return c;
  }

  private sampler(source: InkSource): Sampler | null {
    if (source === 'composite') {
      const c = this.composites[this.activeComposite];
      if (!c) return null;
      // Keep the frozen frame glued to the page if the user scrolls mid-transition.
      return {
        texture: c.texture,
        width: c.width,
        height: c.height,
        ratio: 1,
        offsetX: Math.round((window.scrollX - c.scrollX) * this.canvasScale),
        offsetY: Math.round((window.scrollY - c.scrollY) * this.canvasScale),
        flipY: true,
      };
    }
    const t = this.textures.get(source);
    if (!t) return null;
    return {
      texture: t.texture,
      width: t.width,
      height: t.height,
      ratio: t.scale / this.canvasScale,
      offsetX: Math.floor(window.scrollX * t.scale + 0.5),
      offsetY: Math.floor(window.scrollY * t.scale + 0.5),
      flipY: false,
    };
  }

  private render(frame: InkFrame): boolean {
    const from = this.sampler(frame.from);
    const to = this.sampler(frame.to);
    if (!from || !to) return false;

    const gl = this.gl;
    const { program, uniform } = this.program;
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.useProgram(program);
    gl.bindVertexArray(this.vao);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, from.texture);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, to.texture);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, this.noise);

    gl.uniform1i(uniform('uFrom'), 0);
    gl.uniform1i(uniform('uTo'), 1);
    gl.uniform1i(uniform('uNoise'), 2);
    gl.uniform2f(uniform('uFromSize'), from.width, from.height);
    gl.uniform2f(uniform('uToSize'), to.width, to.height);
    gl.uniform4f(
      uniform('uFromMap'),
      from.ratio,
      from.offsetX,
      from.offsetY,
      from.flipY ? 1 : 0
    );
    gl.uniform4f(
      uniform('uToMap'),
      to.ratio,
      to.offsetX,
      to.offsetY,
      to.flipY ? 1 : 0
    );
    gl.uniform1f(uniform('uCanvasScale'), this.canvasScale);
    gl.uniform2f(uniform('uRes'), this.canvas.width, this.canvas.height);
    gl.uniform2f(uniform('uCenter'), frame.center.x, frame.center.y);
    gl.uniform1f(uniform('uRadius'), frame.radius);
    gl.uniform1f(uniform('uCleanup'), frame.cleanup);
    gl.uniform1f(uniform('uTime'), frame.time);
    gl.uniform1f(
      uniform('uRef'),
      Math.max(this.canvas.width, this.canvas.height) / this.canvasScale
    );
    gl.uniform2f(uniform('uSeed'), frame.seed.x, frame.seed.y);
    const cos = Math.cos(frame.seed.angle);
    const sin = Math.sin(frame.seed.angle);
    gl.uniformMatrix2fv(uniform('uSeedRot'), false, [cos, sin, -sin, cos]);

    gl.uniform1f(uniform('uTendril'), inkParams.tendril);
    gl.uniform1f(uniform('uNoiseScale'), inkParams.noiseScale);
    gl.uniform1f(uniform('uSoftness'), inkParams.softness);
    gl.uniform1f(uniform('uDrift'), inkParams.drift);
    gl.uniform3fv(uniform('uRimColor'), RIM_COLOR[frame.to]);

    gl.drawArrays(gl.TRIANGLES, 0, 3);
    return true;
  }
}
