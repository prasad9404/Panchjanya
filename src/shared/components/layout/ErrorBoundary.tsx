import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "../ui/button";

interface Props {
    children?: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-full flex-1 flex flex-col items-center justify-center bg-[#F8F9FA] p-6 w-full">
                    <div className="max-w-md w-full bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.05)] p-8 text-center border border-gray-100">
                        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-[#0f3c6e] mb-2 font-heading">Something went wrong</h2>
                        <p className="text-gray-500 mb-6 text-sm">
                            {this.state.error?.message || "An unexpected error occurred while rendering this page."}
                        </p>
                        <Button
                            onClick={() => {
                                this.setState({ hasError: false });
                                window.location.reload();
                            }}
                            className="bg-[#0f3c6e] hover:bg-[#0f3c6e]/90 text-white w-full rounded-xl h-11"
                        >
                            Refresh Page
                        </Button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
