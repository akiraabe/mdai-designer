// src/components/Common/SpreadsheetErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class SpreadsheetErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    console.error('🚨 SpreadsheetErrorBoundary: エラーキャッチ', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 SpreadsheetErrorBoundary: 詳細エラー情報', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });
  }

  handleReset = () => {
    console.log('🔄 SpreadsheetErrorBoundary: リセット実行');
    this.setState({ hasError: false, error: undefined });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          height: '500px', 
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#fef2f2',
          border: '2px dashed #fca5a5',
          borderRadius: '8px',
          padding: '40px'
        }}>
          <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold text-red-800 mb-2">
            スプレッドシートでエラーが発生しました
          </h3>
          <p className="text-sm text-red-600 mb-4 text-center">
            データ形式に問題がある可能性があります。<br/>
            リセットするか、ページを再読み込みしてください。
          </p>
          <div className="flex space-x-3">
            <button
              onClick={this.handleReset}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              リセット
            </button>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              ページ再読み込み
            </button>
          </div>
          {this.state.error && (
            <details className="mt-4 text-xs text-gray-600">
              <summary className="cursor-pointer">技術的詳細</summary>
              <pre className="mt-2 p-2 bg-gray-100 rounded max-w-md overflow-auto">
                {this.state.error.message}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}