import { Component, ReactNode } from "react";

interface Props { children: ReactNode; fallback?: ReactNode; }
interface State { hasError: boolean; error: Error | null; }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error: Error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="panel p-8 text-center m-8">
          <p className="font-heading text-lg font-bold text-[var(--short)]">Something broke</p>
          <p className="text-sm text-[var(--inkSoft)] mt-2 font-mono">{this.state.error?.message}</p>
          <button onClick={() => this.setState({ hasError: false, error: null })} className="btn-primary mt-4 text-sm">Try Again</button>
        </div>
      );
    }
    return this.props.children;
  }
}
