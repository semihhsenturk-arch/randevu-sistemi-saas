"use client";

import { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from "react";

export type SignatureCanvasHandle = {
  toDataURL: () => string;
  isEmpty: () => boolean;
  clear: () => void;
};

type Props = {
  width?: number;
  height?: number;
  className?: string;
  onDrawStart?: () => void;
};

export const SignatureCanvas = forwardRef<SignatureCanvasHandle, Props>(
  ({ width = 600, height = 200, className = "", onDrawStart }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasDrawn, setHasDrawn] = useState(false);
    const lastPoint = useRef<{ x: number; y: number } | null>(null);

    // Scale canvas for high-DPI displays
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);

      // Set drawing styles
      ctx.strokeStyle = "#1e293b";
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    }, [width, height]);

    const getPoint = useCallback(
      (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const scaleX = width / rect.width;
        const scaleY = height / rect.height;

        if ("touches" in e) {
          const touch = e.touches[0];
          return {
            x: (touch.clientX - rect.left) * scaleX,
            y: (touch.clientY - rect.top) * scaleY,
          };
        }
        return {
          x: (e.clientX - rect.left) * scaleX,
          y: (e.clientY - rect.top) * scaleY,
        };
      },
      [width, height]
    );

    const startDrawing = useCallback(
      (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!ctx) return;

        const point = getPoint(e);
        lastPoint.current = point;
        setIsDrawing(true);

        // Start a new path and place a dot at the starting point
        ctx.beginPath();
        ctx.moveTo(point.x, point.y);
        // Draw a tiny dot so single taps are visible
        ctx.lineTo(point.x + 0.1, point.y + 0.1);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(point.x, point.y);

        if (!hasDrawn) {
          setHasDrawn(true);
          onDrawStart?.();
        }
      },
      [getPoint, hasDrawn, onDrawStart]
    );

    const draw = useCallback(
      (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!ctx || !lastPoint.current) return;

        const currentPoint = getPoint(e);

        // Draw a continuous line segment from last point to current point
        ctx.lineTo(currentPoint.x, currentPoint.y);
        ctx.stroke();

        // Continue the path from the current point (keeps the line connected)
        ctx.beginPath();
        ctx.moveTo(currentPoint.x, currentPoint.y);

        lastPoint.current = currentPoint;
      },
      [isDrawing, getPoint]
    );

    const stopDrawing = useCallback(() => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (ctx && isDrawing) {
        ctx.closePath();
      }
      setIsDrawing(false);
      lastPoint.current = null;
    }, [isDrawing]);

    const clear = useCallback(() => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!ctx || !canvas) return;
      const dpr = window.devicePixelRatio || 1;
      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
      setHasDrawn(false);
    }, []);

    useImperativeHandle(ref, () => ({
      toDataURL: () => {
        return canvasRef.current?.toDataURL("image/png") || "";
      },
      isEmpty: () => !hasDrawn,
      clear,
    }));

    return (
      <div className={`relative ${className}`}>
        <canvas
          ref={canvasRef}
          className="w-full border-2 border-dashed border-slate-300 rounded-xl bg-white cursor-crosshair touch-none"
          style={{ height: `${height}px` }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        {!hasDrawn && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-slate-400 text-sm font-medium italic">
              Lütfen parmağınız veya kalem ile imzanızı atınız
            </span>
          </div>
        )}
      </div>
    );
  }
);

SignatureCanvas.displayName = "SignatureCanvas";
