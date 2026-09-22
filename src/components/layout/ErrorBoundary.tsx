import { Component, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[hsl(var(--surface-page))] p-6">
          <div className="w-full max-w-md space-y-6 rounded-[var(--radius-card)] border border-border bg-card p-8 text-center shadow-lg">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-pill bg-destructive/10">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold">Une erreur est survenue</h1>
              <p className="text-sm text-muted-foreground">
                Désolé, quelque chose s'est mal passé. Vous pouvez retourner au
                tableau de bord pour continuer.
              </p>
              {this.state.error?.message && (
                <p className="mt-3 break-all rounded-[var(--radius)] bg-muted p-2 font-mono text-xs text-muted-foreground/80">
                  {this.state.error.message}
                </p>
              )}
            </div>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => window.location.reload()}>
                Recharger
              </Button>
              <Button onClick={this.handleReset}>
                Retour au dashboard
              </Button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
