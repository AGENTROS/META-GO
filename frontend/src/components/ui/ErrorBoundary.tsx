'use client';
import React, { Component, ReactNode } from 'react';

interface State { hasError: boolean; error?: Error }

export class WidgetErrorBoundary extends Component<{ children: ReactNode; name: string }, State> {
  state: State = { hasError: false };
  static getDerivedStateFromError(error: Error): State { return { hasError: true, error }; }
  componentDidCatch(error: Error) { console.error(`[${this.props.name}] error:`, error); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full min-h-[120px] text-center px-4">
          <div>
            <div className="text-xs font-mono text-red-500 mb-1">⚠ {this.props.name}</div>
            <div className="text-[10px] text-zinc-450">Widget temporarily unavailable</div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
