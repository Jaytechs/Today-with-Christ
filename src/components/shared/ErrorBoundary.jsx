import { Component } from "react";
import { ErrorState } from "./UIStates";

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorState onRetry={() => this.setState({ hasError: false })} />;
    }
    return this.props.children;
  }
}
