# src/mdai_mcp_server/tools/design_draft_generator.py
"""
設計書ドラフト生成ツール
AI動的生成による設計書ドラフトとドキュメント生成
"""

from typing import Dict, Optional, List, Any
from datetime import datetime
import json
from ..ai_service import ai_service

def setup_design_draft_tools(app):
    """設計書ドラフト生成ツールをMCPアプリに登録"""
    
    @app.tool()
    async def generate_design_draft(
        prompt: str,
        context: Optional[Dict] = None,
        target_type: Optional[str] = None,
        project_context: Optional[Dict] = None
    ) -> Dict:
        """
        設計書ドラフト生成（AI動的生成）
        
        Args:
            prompt: ユーザーからの生成要求
            context: 現在のWebUIデータ
            target_type: 生成対象タイプ（screen/model/api等）
            project_context: プロジェクト情報
            
        Returns:
            生成された設計書ドラフト情報
        """
        
        print(f"📥 AI Design draft generation request received:")
        print(f"   Prompt: {prompt}")
        print(f"   Target type: {target_type or 'auto-detect'}")
        print(f"   Project: {project_context.get('name', '不明') if project_context else '不明'}")
        
        try:
            # AI経由で設計書ドラフトを生成
            result = await ai_service.generate_design_draft(
                prompt=prompt,
                context=context or {},
                target_type=target_type,
                project_context=project_context
            )
            
            print(f"✅ AI Design draft generated successfully")
            print(f"   Mode: {result['metadata']['mode']}")
            print(f"   AI Provider: {result['metadata']['ai_provider']}")
            print(f"   Target type: {result['metadata']['target_type']}")
            
            if 'spreadsheetData' in result:
                print(f"   Spreadsheet rows: {len(result['spreadsheetData'])}")
            if 'markdownContent' in result:
                print(f"   Markdown chars: {len(result['markdownContent'])}")
            
            return result
            
        except Exception as e:
            print(f"❌ AI design draft generation error: {e}")
            print(f"🔄 Falling back to error response")
            
            # エラー時は明確なエラーメッセージを返す
            error_result = {
                "spreadsheetData": [
                    {"項目名": "エラー", "データ型": "string", "必須": "○", "説明": f"生成エラー: {str(e)}"}
                ],
                "markdownContent": f"""## ❌ 設計書ドラフト生成エラー

### エラー詳細
- **発生日時**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
- **エラー内容**: {str(e)}
- **プロンプト**: {prompt}
- **対象タイプ**: {target_type or 'auto-detect'}

### 対処方法
1. **AI API設定確認**: 環境変数が正しく設定されているか確認
2. **ネットワーク確認**: インターネット接続状況を確認
3. **再試行**: しばらく時間をおいて再度実行

### 環境変数設定例
```bash
export OPENAI_API_KEY="your-openai-key"
export AWS_ACCESS_KEY_ID="your-aws-key"
export AWS_SECRET_ACCESS_KEY="your-aws-secret"
export AWS_REGION="us-west-2"
```
""",
                "metadata": {
                    "generated_at": datetime.now().isoformat(),
                    "prompt_used": prompt,
                    "mode": "error",
                    "target_type": target_type or "unknown",
                    "project_context": project_context,
                    "server_version": "0.1.0",
                    "generation_type": "error_response",
                    "error": str(e)
                }
            }
            
            return error_result
    
    @app.tool()
    async def generate_chat_response(
        user_message: str,
        context: Optional[Dict] = None,
        document_type: Optional[str] = None,
        project_context: Optional[Dict] = None
    ) -> Dict:
        """
        チャット応答生成（AI動的生成）
        
        Args:
            user_message: ユーザーからのメッセージ
            context: 現在のWebUIデータ
            document_type: ドキュメントタイプ（screen/model/api等）
            project_context: プロジェクト情報
            
        Returns:
            生成されたチャット応答
        """
        
        print(f"📥 AI Chat response request received:")
        print(f"   Message: {user_message}")
        print(f"   Document type: {document_type or 'general'}")
        print(f"   Project: {project_context.get('name', '不明') if project_context else '不明'}")
        
        try:
            # AI経由でチャット応答を生成
            response = await ai_service.generate_chat_response(
                user_message=user_message,
                context=context or {},
                document_type=document_type,
                project_context=project_context
            )
            
            print(f"✅ AI Chat response generated successfully")
            print(f"   Response chars: {len(response)}")
            
            result = {
                "response": response,
                "metadata": {
                    "generated_at": datetime.now().isoformat(),
                    "message_used": user_message,
                    "mode": "chat_response",
                    "document_type": document_type or "general",
                    "project_context": project_context,
                    "server_version": "0.1.0",
                    "generation_type": "ai_chat_response"
                }
            }
            
            return result
            
        except Exception as e:
            print(f"❌ AI chat response generation error: {e}")
            print(f"🔄 Falling back to error response")
            
            # エラー時は明確なエラーメッセージを返す
            error_response = f"""申し訳ございません。チャット応答の生成中にエラーが発生しました。

**エラー詳細**:
- 発生日時: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
- エラー内容: {str(e)}
- メッセージ: {user_message}

**対処方法**:
1. AI API設定を確認してください
2. ネットワーク接続を確認してください
3. しばらく時間をおいて再度お試しください

ご不便をおかけして申し訳ございません。"""
            
            result = {
                "response": error_response,
                "metadata": {
                    "generated_at": datetime.now().isoformat(),
                    "message_used": user_message,
                    "mode": "error",
                    "document_type": document_type or "general",
                    "project_context": project_context,
                    "server_version": "0.1.0",
                    "generation_type": "error_response",
                    "error": str(e)
                }
            }
            
            return result

    @app.tool()
    async def generate_mockup_html(
        prompt: str,
        context: Optional[Dict] = None,
        project_context: Optional[Dict] = None
    ) -> Dict:
        """
        AI画面イメージ（HTML+CSS）生成
        
        Args:
            prompt: 画面イメージ生成用プロンプト
            context: 現在のWebUIデータ（要件・項目定義等）
            project_context: プロジェクト情報
            
        Returns:
            生成されたHTML+CSS文字列
        """
        
        print(f"📥 AI Mockup HTML generation request received:")
        print(f"   Prompt length: {len(prompt)} chars")
        print(f"   Project: {project_context.get('name', '不明') if project_context else '不明'}")
        
        try:
            # AI経由でHTML+CSS画面イメージを生成
            html_result = await ai_service.generate_mockup_html(
                prompt=prompt,
                context=context or {},
                project_context=project_context
            )
            
            print(f"✅ AI Mockup HTML generated successfully")
            print(f"   HTML length: {len(html_result)} chars")
            
            result = {
                "html": html_result,
                "metadata": {
                    "generated_at": datetime.now().isoformat(),
                    "prompt_used": prompt,
                    "mode": "mockup_html",
                    "project_context": project_context,
                    "server_version": "0.1.0",
                    "generation_type": "ai_mockup_html"
                }
            }
            
            return result
            
        except Exception as e:
            print(f"❌ AI mockup HTML generation error: {e}")
            print(f"🔄 Falling back to default HTML")
            
            # エラー時はダミーHTMLを返す
            default_html = """
<style>
  .ai-mockup-container { font-family: sans-serif; background: #f9fafb; padding: 24px; border-radius: 12px; }
  .ai-mockup-title { font-size: 1.5rem; font-weight: bold; margin-bottom: 16px; color: #dc2626; }
  .ai-mockup-error { background: #fef2f2; border: 1px solid #fecaca; padding: 16px; border-radius: 8px; margin-bottom: 16px; }
  .ai-mockup-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  .ai-mockup-table th, .ai-mockup-table td { border: 1px solid #d1d5db; padding: 8px; }
  .ai-mockup-button { background: #2563eb; color: #fff; border: none; border-radius: 6px; padding: 8px 16px; font-size: 1rem; cursor: pointer; }
</style>
<div class="ai-mockup-container">
  <div class="ai-mockup-title">❌ AI生成エラー</div>
  <div class="ai-mockup-error">
    <strong>エラー詳細:</strong> {error}<br>
    <strong>発生日時:</strong> {timestamp}<br>
    <strong>対処方法:</strong> AI API設定を確認してください
  </div>
  <table class="ai-mockup-table">
    <thead>
      <tr><th>項目</th><th>状況</th></tr>
    </thead>
    <tbody>
      <tr><td>API接続</td><td>エラー</td></tr>
      <tr><td>HTML生成</td><td>失敗</td></tr>
    </tbody>
  </table>
  <button class="ai-mockup-button">再試行</button>
</div>
""".format(error=str(e), timestamp=datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
            
            result = {
                "html": default_html,
                "metadata": {
                    "generated_at": datetime.now().isoformat(),
                    "prompt_used": prompt,
                    "mode": "error",
                    "project_context": project_context,
                    "server_version": "0.1.0",
                    "generation_type": "error_response",
                    "error": str(e)
                }
            }
            
            return result

    @app.tool()
    async def generate_modification_proposal(
        system_prompt: str,
        user_prompt: str,
        context: Optional[Dict] = None,
        project_context: Optional[Dict] = None
    ) -> Dict:
        """
        AI修正提案生成
        
        Args:
            system_prompt: システムプロンプト（修正提案生成用の指示）
            user_prompt: ユーザープロンプト（具体的な修正要求）
            context: 現在のWebUIデータ
            project_context: プロジェクト情報
            
        Returns:
            生成された修正提案テキスト
        """
        
        print(f"📥 AI Modification proposal request received:")
        print(f"   System prompt length: {len(system_prompt)} chars")
        print(f"   User prompt length: {len(user_prompt)} chars")
        print(f"   Project: {project_context.get('name', '不明') if project_context else '不明'}")
        
        try:
            # AI経由で修正提案を生成
            proposal_result = await ai_service.generate_modification_proposal(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                context=context or {},
                project_context=project_context
            )
            
            print(f"✅ AI Modification proposal generated successfully")
            print(f"   Response length: {len(proposal_result)} chars")
            
            result = {
                "response": proposal_result,
                "metadata": {
                    "generated_at": datetime.now().isoformat(),
                    "system_prompt_used": system_prompt,
                    "user_prompt_used": user_prompt,
                    "mode": "modification_proposal",
                    "project_context": project_context,
                    "server_version": "0.1.0",
                    "generation_type": "ai_modification_proposal"
                }
            }
            
            return result
            
        except Exception as e:
            print(f"❌ AI modification proposal generation error: {e}")
            print(f"🔄 Falling back to error response")
            
            # エラー時は明確なエラーメッセージを返す
            error_response = f"""修正提案の生成中にエラーが発生しました。

**エラー詳細**:
- 発生日時: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
- エラー内容: {str(e)}
- ユーザー要求: {user_prompt}

**対処方法**:
1. AI API設定を確認してください
2. ネットワーク接続を確認してください
3. しばらく時間をおいて再度お試しください

申し訳ございません。手動で修正を行うか、後ほど再試行してください。"""
            
            result = {
                "response": error_response,
                "metadata": {
                    "generated_at": datetime.now().isoformat(),
                    "system_prompt_used": system_prompt,
                    "user_prompt_used": user_prompt,
                    "mode": "error",
                    "project_context": project_context,
                    "server_version": "0.1.0",
                    "generation_type": "error_response",
                    "error": str(e)
                }
            }
            
            return result

    # ツール登録完了をログ出力
    print("🛠️ Design draft generation tools registered:")
    print("   - generate_design_draft: AI動的設計書ドラフト生成（OpenAI/Bedrock）")
    print("   - generate_chat_response: AI動的チャット応答生成（OpenAI/Bedrock）")
    print("   - generate_mockup_html: AI画面イメージHTML+CSS生成（OpenAI/Bedrock）")
    print("   - generate_modification_proposal: AI修正提案生成（OpenAI/Bedrock）")