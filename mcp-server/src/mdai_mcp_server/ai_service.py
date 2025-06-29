# src/mdai_mcp_server/ai_service.py
"""
AI Service for MCP Server
WebUIのaiServiceと同等の機能をMCPサーバー側で提供
"""

import os
import json
from typing import Dict, Any, Optional
from datetime import datetime
import re
from dotenv import load_dotenv

# 環境変数を読み込み
load_dotenv()

# AI APIs
try:
    import openai
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False

try:
    import boto3
    from botocore.exceptions import ClientError
    BEDROCK_AVAILABLE = True
except ImportError:
    BEDROCK_AVAILABLE = False

class AIService:
    """AI生成サービス"""
    
    def __init__(self):
        # 環境変数からAPI設定を読み込み
        self.openai_api_key = os.getenv('OPENAI_API_KEY')
        self.aws_access_key = os.getenv('AWS_ACCESS_KEY_ID')
        self.aws_secret_key = os.getenv('AWS_SECRET_ACCESS_KEY')
        self.aws_region = os.getenv('AWS_REGION', 'us-west-2')
        
        # 優先度順でAIサービスを設定
        self.ai_providers = []
        
        if BEDROCK_AVAILABLE and self.aws_access_key:
            self.ai_providers.append('bedrock')
        
        if OPENAI_AVAILABLE and self.openai_api_key:
            self.ai_providers.append('openai')
        
        print(f"🤖 AI Service initialized with providers: {self.ai_providers}")
        print(f"🔧 Debug info:")
        print(f"   OpenAI available: {OPENAI_AVAILABLE}")
        print(f"   Bedrock available: {BEDROCK_AVAILABLE}")
        print(f"   OpenAI key set: {'Yes' if self.openai_api_key else 'No'}")
        print(f"   AWS key set: {'Yes' if self.aws_access_key else 'No'}")
    
    async def generate_data_model(
        self, 
        prompt: str, 
        project_context: Optional[Dict] = None,
        references: Optional[list] = None,
        current_mermaid_code: str = ""
    ) -> Dict[str, Any]:
        """
        データモデル生成（WebUIのプロンプトを使用）
        """
        
        print(f"🎯 AI Data Model Generation Request:")
        print(f"   Prompt: {prompt[:100]}...")
        print(f"   Project: {project_context.get('name', '不明') if project_context else '不明'}")
        print(f"   Current Mermaid: {'あり' if current_mermaid_code else '未設定'}")
        
        # 詳細なMermaidプロンプトを構築（WebUIから移植）
        mermaid_prompt = f"""
【絶対ルール】あなたはデータモデル設計書専用です。以下の指示を必ずMermaid ER図で応答してください。

指示: {prompt}

【重要な解釈指針】:
どんな指示でも（画面、UI、機能などの単語があっても）、必要なデータ構造をER図で設計してください。
- 「画面を作って」→ その画面で扱うデータのエンティティ設計
- 「ログイン機能」→ User、Session等のエンティティ設計
- 「注文システム」→ Order、OrderItem、Product等のエンティティ設計
- 「管理機能」→ 管理に必要なデータ構造設計

現在の設計書状況:
- プロジェクト: {project_context.get('name', '不明') if project_context else '不明'}
- Mermaid ER図: {('あり（追加・修正）' if current_mermaid_code else '未設定（新規作成）')}
- 参照設計書: {', '.join(references) if references else 'なし'}

【必須】erDiagramで始まるMermaid記法で応答してください。エンティティと関係を定義してください。

【重要：Mermaid記法注意事項】
- エンティティ名にバッククォート（`）は絶対に使用しないでください
- エンティティ名は英数字のみで記述してください
- SQLの予約語でもMermaidではそのまま記述してください
- フィールドのキー指定は「PK」または「FK」のみ（「PK FK」は不正）
- 複合主キーの場合は複数のフィールドにそれぞれ「PK」を指定

例:
erDiagram
    User {{
        int id PK
        string name
        string email
        datetime created_at
    }}
    Order {{
        int id PK
        int user_id FK
        decimal amount
        datetime order_date
    }}
    ProductCategory {{
        int product_id PK
        int category_id PK
    }}
    User ||--o{{ Order : "has many"
        """
        
        try:
            # AI応答を生成
            ai_response = await self._generate_with_ai(mermaid_prompt)
            
            # Mermaidコードを抽出
            mermaid_code = self._extract_mermaid_code(ai_response)
            
            if not mermaid_code:
                raise ValueError("Mermaidコードの抽出に失敗しました")
            
            # 補足説明を生成
            supplement = self._generate_supplement(
                prompt, 
                mermaid_code, 
                project_context, 
                references
            )
            
            result = {
                "mermaidCode": mermaid_code,
                "supplement": supplement,
                "metadata": {
                    "generated_at": datetime.now().isoformat(),
                    "prompt_used": prompt,
                    "mode": "ai_generated",
                    "project_context": project_context,
                    "references": references or [],
                    "server_version": "0.1.0",
                    "generation_type": "dynamic_ai_mermaid",
                    "ai_provider": self.ai_providers[0] if self.ai_providers else "none"
                }
            }
            
            print(f"✅ AI Data Model Generated:")
            mermaid_lines = len(mermaid_code.split('\n'))
            print(f"   Mermaid lines: {mermaid_lines}")
            print(f"   Supplement chars: {len(supplement)}")
            print(f"   AI Provider: {result['metadata']['ai_provider']}")
            
            return result
            
        except Exception as e:
            print(f"❌ AI Generation Error: {e}")
            # エラー時は固定データを返す（フォールバック）
            return await self._generate_fallback_data(prompt, project_context, references)
    
    async def _generate_with_ai(self, prompt: str) -> str:
        """AI APIを使用して応答生成"""
        
        # Bedrockを優先
        if 'bedrock' in self.ai_providers:
            try:
                return await self._generate_with_bedrock(prompt)
            except Exception as e:
                print(f"⚠️ Bedrock generation failed: {e}")
        
        # OpenAIをフォールバック
        if 'openai' in self.ai_providers:
            try:
                return await self._generate_with_openai(prompt)
            except Exception as e:
                print(f"⚠️ OpenAI generation failed: {e}")
        
        raise ValueError("No AI providers available")
    
    async def _generate_with_bedrock(self, prompt: str) -> str:
        """AWS Bedrock Claude経由での生成"""
        
        bedrock = boto3.client(
            'bedrock-runtime',
            region_name=self.aws_region,
            aws_access_key_id=self.aws_access_key,
            aws_secret_access_key=self.aws_secret_key
        )
        
        body = json.dumps({
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "max_tokens": 4000,
            "temperature": 0.7,
            "anthropic_version": "bedrock-2023-05-31"
        })
        
        response = bedrock.invoke_model(
            modelId="anthropic.claude-3-sonnet-20240229-v1:0",
            contentType="application/json",
            accept="application/json",
            body=body
        )
        
        response_body = json.loads(response['body'].read())
        return response_body['content'][0]['text']
    
    async def _generate_with_openai(self, prompt: str) -> str:
        """OpenAI GPT経由での生成"""
        
        print(f"🔵 OpenAI API呼び出し開始...")
        print(f"   Model: gpt-4.1")
        print(f"   API Key: {'設定済み' if self.openai_api_key else '未設定'}")
        
        try:
            client = openai.OpenAI(api_key=self.openai_api_key)
            
            response = client.chat.completions.create(
                model="gpt-4.1",  # コスト・精度・速度のバランス最適
                messages=[
                    {"role": "user", "content": prompt}
                ],
                max_tokens=4000,
                temperature=0.7
            )
            
            print(f"✅ OpenAI API成功: {len(response.choices[0].message.content)}文字")
            return response.choices[0].message.content
            
        except Exception as e:
            print(f"❌ OpenAI API失敗: {type(e).__name__}: {str(e)}")
            raise
    
    def _extract_mermaid_code(self, ai_response: str) -> str:
        """AI応答からMermaidコードを抽出"""
        
        # コードブロック内のmermaidコードを抽出
        mermaid_match = re.search(r'```(?:mermaid)?\s*(erDiagram[\s\S]*?)```', ai_response, re.IGNORECASE)
        if mermaid_match:
            mermaid_code = mermaid_match.group(1).strip()
        else:
            # コードブロックなしの場合、erDiagramから抽出
            mermaid_match = re.search(r'(erDiagram[\s\S]*)', ai_response, re.IGNORECASE)
            if mermaid_match:
                mermaid_code = mermaid_match.group(1).strip()
            else:
                return ""
        
        # Mermaid文法エラーを防ぐための後処理
        mermaid_code = self._fix_mermaid_syntax(mermaid_code)
        return mermaid_code
    
    def _fix_mermaid_syntax(self, mermaid_code: str) -> str:
        """Mermaid文法エラーを修正"""
        
        print(f"🔧 Mermaid記法チェック・修正中...")
        
        # バッククォートを除去（最も重要）
        fixed_code = re.sub(r'`([^`]+)`', r'\1', mermaid_code)
        
        # 不正な文字をチェック
        if '`' in fixed_code:
            print(f"⚠️ バッククォートを除去: {fixed_code.count('`')}個")
            fixed_code = fixed_code.replace('`', '')
        
        # 「PK FK」を「PK」に修正（重要）
        pk_fk_count = len(re.findall(r'\s+PK\s+FK\s*', fixed_code))
        if pk_fk_count > 0:
            print(f"⚠️ 「PK FK」を「PK」に修正: {pk_fk_count}箇所")
            fixed_code = re.sub(r'\s+PK\s+FK\s*', ' PK', fixed_code)
        
        # 「FK PK」を「PK」に修正
        fk_pk_count = len(re.findall(r'\s+FK\s+PK\s*', fixed_code))
        if fk_pk_count > 0:
            print(f"⚠️ 「FK PK」を「PK」に修正: {fk_pk_count}箇所")
            fixed_code = re.sub(r'\s+FK\s+PK\s*', ' PK', fixed_code)
        
        # エンティティ名の検証（英数字のみ）
        entity_names = re.findall(r'^\s*([A-Za-z_][A-Za-z0-9_]*)\s*\{', fixed_code, re.MULTILINE)
        print(f"✅ 検出されたエンティティ: {', '.join(entity_names)}")
        
        return fixed_code
    
    def _generate_supplement(
        self, 
        prompt: str, 
        mermaid_code: str, 
        project_context: Optional[Dict], 
        references: Optional[list]
    ) -> str:
        """補足説明を生成"""
        
        # エンティティ数を計算
        entities = re.findall(r'(\w+)\s*\{', mermaid_code)
        relations = re.findall(r'\|\|--[o{].*?:', mermaid_code)
        
        supplement = f"""## データモデル設計書

### 生成情報
- **生成日時**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
- **プロンプト**: {prompt}
- **プロジェクト**: {project_context.get('name', '不明') if project_context else '不明'}
- **生成方式**: AI動的生成（MCP Server）

### モデル概要
{prompt}の要求に基づいて設計されたER図です。

#### 設計統計
- **エンティティ数**: {len(entities)}個
- **リレーション数**: {len(relations)}個
- **検出されたエンティティ**: {', '.join(entities) if entities else 'なし'}

#### データモデルの特徴
このER図は以下の設計原則に基づいて生成されました：
- **正規化**: データの重複を避け、整合性を保つ設計
- **リレーション**: エンティティ間の適切な関係定義
- **スケーラビリティ**: 将来の拡張を考慮した柔軟な構造

### 🤖 AI生成詳細
- **生成エンジン**: MCP Server AI Integration
- **プロンプト最適化**: データモデル特化型プロンプト使用
- **品質保証**: Mermaid記法の構文チェック済み

### 参照情報
{f"参照された設計書: {', '.join(references)}" if references else "参照設計書: なし"}

### 次のステップ
1. 「データモデル」タブでER図を確認
2. 必要に応じてエンティティやリレーションを修正・追加
3. 画面設計書との整合性を確認
"""
        
        return supplement
    
    async def generate_design_draft(
        self,
        prompt: str,
        context: Dict[str, Any],
        target_type: Optional[str] = None,
        project_context: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        設計書ドラフト生成（WebUIのaiServiceと同等機能）
        """
        
        print(f"🎯 AI Design Draft Generation Request:")
        print(f"   Prompt: {prompt[:100]}...")
        print(f"   Target type: {target_type or 'auto-detect'}")
        print(f"   Project: {project_context.get('name', '不明') if project_context else '不明'}")
        
        # ターゲットタイプの推定
        if not target_type:
            target_type = self._infer_target_type(prompt)
        
        # WebUIがブランクかどうかの判定
        is_blank = self._is_webui_blank(context)
        
        # システムプロンプト作成
        system_prompt = self._create_system_prompt(context, target_type, is_blank)
        
        try:
            # AI応答を生成
            ai_response = await self._generate_with_ai(system_prompt + "\n\n" + prompt)
            
            # レスポンスをパース
            result = self._parse_ai_response(ai_response, prompt, target_type)
            
            result["metadata"] = {
                "generated_at": datetime.now().isoformat(),
                "prompt_used": prompt,
                "mode": "ai_generated",
                "target_type": target_type,
                "project_context": project_context,
                "server_version": "0.1.0",
                "generation_type": "design_draft",
                "ai_provider": self.ai_providers[0] if self.ai_providers else "none"
            }
            
            print(f"✅ AI Design Draft Generated:")
            if 'spreadsheetData' in result:
                print(f"   Spreadsheet rows: {len(result['spreadsheetData'])}")
            if 'markdownContent' in result:
                print(f"   Markdown chars: {len(result['markdownContent'])}")
            print(f"   Target type: {target_type}")
            print(f"   AI Provider: {result['metadata']['ai_provider']}")
            
            return result
            
        except Exception as e:
            print(f"❌ AI Design Draft Generation Error: {e}")
            return await self._generate_fallback_design_draft(prompt, target_type, project_context)
    
    async def generate_chat_response(
        self,
        user_message: str,
        context: Dict[str, Any],
        document_type: Optional[str] = None,
        project_context: Optional[Dict] = None
    ) -> str:
        """
        チャット応答生成（WebUIのaiServiceと同等機能）
        """
        
        print(f"🎯 AI Chat Response Generation Request:")
        print(f"   Message: {user_message[:100]}...")
        print(f"   Document type: {document_type or 'general'}")
        print(f"   Project: {project_context.get('name', '不明') if project_context else '不明'}")
        
        # チャット用システムプロンプト作成
        system_prompt = self._create_chat_system_prompt(context, document_type)
        
        try:
            # AI応答を生成
            response = await self._generate_with_ai(system_prompt + "\n\n" + user_message)
            
            print(f"✅ AI Chat Response Generated:")
            print(f"   Response chars: {len(response)}")
            print(f"   AI Provider: {self.ai_providers[0] if self.ai_providers else 'none'}")
            
            return response
            
        except Exception as e:
            print(f"❌ AI Chat Response Generation Error: {e}")
            return f"""申し訳ございません。チャット応答の生成中にエラーが発生しました。

**エラー詳細**:
- 発生日時: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
- エラー内容: {str(e)}
- メッセージ: {user_message}

**対処方法**:
1. AI API設定を確認してください
2. ネットワーク接続を確認してください
3. しばらく時間をおいて再度お試しください

ご不便をおかけして申し訳ございません。"""
    
    def _infer_target_type(self, prompt: str) -> str:
        """プロンプトから対象タイプを推定"""
        prompt_lower = prompt.lower()
        
        if any(keyword in prompt_lower for keyword in ['画面', 'ui', 'ux', 'レイアウト', 'ページ']):
            return 'screen'
        elif any(keyword in prompt_lower for keyword in ['データ', 'モデル', 'テーブル', 'エンティティ', 'er']):
            return 'model'
        elif any(keyword in prompt_lower for keyword in ['api', 'endpoint', 'リクエスト', 'レスポンス']):
            return 'api'
        else:
            return 'screen'  # デフォルト
    
    def _is_webui_blank(self, context: Dict[str, Any]) -> bool:
        """WebUIがブランクかどうかの判定"""
        if not context:
            return True
        
        # スプレッドシートデータの確認
        spreadsheet_data = context.get('spreadsheetData', [])
        if spreadsheet_data and len(spreadsheet_data) > 0:
            # 空でない項目があるかチェック
            for row in spreadsheet_data:
                if row.get('項目名') and row.get('項目名').strip():
                    return False
        
        # Markdownコンテンツの確認
        markdown_content = context.get('markdownContent', '')
        if markdown_content and markdown_content.strip():
            return False
        
        return True
    
    def _create_system_prompt(self, context: Dict[str, Any], target_type: str, is_blank: bool) -> str:
        """システムプロンプト作成"""
        
        if target_type == 'screen':
            return f"""あなたは画面設計書の専門家です。以下の要求に対して、画面設計書を生成してください。

{'【新規作成モード】' if is_blank else '【追加・修正モード】'}

出力形式は以下のJSON形式で応答してください：
{{
  "spreadsheetData": [
    {{"項目名": "項目名", "データ型": "データ型", "必須": "○/×", "説明": "詳細説明"}},
    ...
  ],
  "markdownContent": "# 画面設計書\\n\\n## 表示条件\\n..."
}}

現在の設計書状況:
- スプレッドシートデータ: {len(context.get('spreadsheetData', []))}行
- Markdownコンテンツ: {len(context.get('markdownContent', ''))}文字

画面設計書として必要な要素を含めてください：
- 表示条件
- 項目定義（スプレッドシート形式）
- 画面イメージ（テキスト説明）
- 補足説明"""
        
        elif target_type == 'api':
            return f"""あなたはAPI設計書の専門家です。以下の要求に対して、API設計書を生成してください。

{'【新規作成モード】' if is_blank else '【追加・修正モード】'}

出力形式は以下のJSON形式で応答してください：
{{
  "spreadsheetData": [
    {{"項目名": "パラメータ名", "データ型": "データ型", "必須": "○/×", "説明": "詳細説明"}},
    ...
  ],
  "markdownContent": "# API設計書\\n\\n## エンドポイント\\n..."
}}

API設計書として必要な要素を含めてください：
- エンドポイント定義
- リクエスト/レスポンス仕様
- パラメータ定義（スプレッドシート形式）
- エラーハンドリング"""
        
        else:  # model
            return f"""あなたはデータモデル設計書の専門家です。以下の要求に対して、データモデル設計書を生成してください。

{'【新規作成モード】' if is_blank else '【追加・修正モード】'}

出力形式は以下のJSON形式で応答してください：
{{
  "spreadsheetData": [
    {{"項目名": "フィールド名", "データ型": "データ型", "必須": "○/×", "説明": "詳細説明"}},
    ...
  ],
  "markdownContent": "# データモデル設計書\\n\\n## エンティティ定義\\n..."
}}

データモデル設計書として必要な要素を含めてください：
- エンティティ定義
- フィールド定義（スプレッドシート形式）
- リレーション定義
- 制約条件"""
    
    def _create_chat_system_prompt(self, context: Dict[str, Any], document_type: Optional[str]) -> str:
        """チャット用システムプロンプト作成"""
        
        doc_type_name = {
            'screen': '画面設計書',
            'model': 'データモデル設計書',
            'api': 'API設計書'
        }.get(document_type, '設計書')
        
        return f"""あなたは{doc_type_name}の専門家です。
ユーザーの質問に対して、現在の設計書の内容を踏まえて回答してください。

現在の設計書状況:
- スプレッドシートデータ: {len(context.get('spreadsheetData', []))}行
- Markdownコンテンツ: {len(context.get('markdownContent', ''))}文字
- Mermaidコード: {len(context.get('mermaidCode', ''))}文字

回答時の注意点:
- 技術的に正確な情報を提供
- 具体的で実用的なアドバイス
- 現在の設計書との整合性を考慮
- 日本語で分かりやすく説明"""
    
    def _parse_ai_response(self, ai_response: str, prompt: str, target_type: str) -> Dict[str, Any]:
        """AI応答をパースして構造化データに変換（WebUI GeneratedDraft形式）"""
        
        # JSON形式の応答を抽出
        json_match = re.search(r'\{[\s\S]*\}', ai_response)
        if json_match:
            try:
                parsed_data = json.loads(json_match.group(0))
                if 'spreadsheetData' in parsed_data and 'markdownContent' in parsed_data:
                    # AI生成されたJSONをGeneratedDraft形式に変換
                    return self._convert_ai_json_to_draft(parsed_data, target_type)
            except json.JSONDecodeError:
                pass
        
        # JSON抽出失敗時はテキストから生成
        return self._extract_from_text(ai_response, target_type)
    
    def _convert_ai_json_to_draft(self, ai_data: Dict, target_type: str) -> Dict[str, Any]:
        """AI生成JSONをWebUI GeneratedDraft形式に変換"""
        
        # スプレッドシートデータを変換
        spreadsheet_cells = []
        if 'spreadsheetData' in ai_data and ai_data['spreadsheetData']:
            spreadsheet_cells = self._convert_table_to_cells(ai_data['spreadsheetData'])
        
        # Markdownコンテンツを分割
        markdown_content = ai_data.get('markdownContent', '')
        conditions, supplement = self._split_markdown_content(markdown_content)
        
        return {
            "type": "mixed",
            "spreadsheetData": spreadsheet_cells,
            "conditions": conditions or markdown_content,
            "supplement": supplement
        }
    
    def _convert_table_to_cells(self, table_data: list) -> list:
        """表形式データをセル形式に変換（WebUI GeneratedDraft互換）"""
        cells = []
        
        # ヘッダー行
        headers = ['項目名', 'データ型', '必須', '説明']
        for col_index, header in enumerate(headers):
            cells.append({
                'r': 0,
                'c': col_index,
                'v': header
            })
        
        # データ行
        for row_index, row_data in enumerate(table_data):
            data_row = row_index + 1
            cells.extend([
                {'r': data_row, 'c': 0, 'v': row_data.get('項目名', '')},
                {'r': data_row, 'c': 1, 'v': row_data.get('データ型', '')},
                {'r': data_row, 'c': 2, 'v': row_data.get('必須', '')},
                {'r': data_row, 'c': 3, 'v': row_data.get('説明', '')}
            ])
        
        return cells
    
    def _split_markdown_content(self, markdown_content: str) -> tuple:
        """markdownContentをconditionsとsupplementに分割"""
        lines = markdown_content.split('\n')
        
        # セクション別に分類
        conditions_lines = []
        supplement_lines = []
        current_section = 'supplement'  # デフォルト
        skip_section = False  # 項目定義セクションをスキップ
        
        for i, line in enumerate(lines):
            line_lower = line.lower()
            
            # 表示条件に関連するセクションを検出
            if any(keyword in line_lower for keyword in [
                '表示条件', '条件', 'condition', 
                '表示制御', '画面表示条件', '表示ルール'
            ]) and line.startswith('#'):
                current_section = 'conditions'
                skip_section = False
                conditions_lines.append(line)
                continue
                
            # 項目定義セクションをスキップ（スプレッドシートで表示されるため）
            elif '項目定義' in line_lower and line.startswith('#'):
                current_section = 'skip'
                skip_section = True
                continue
                
            # 補足説明セクションを検出（明示的な場合）
            elif any(keyword in line_lower for keyword in [
                '補足説明', '補足', '注意', '備考', '詳細', 
                '画面イメージ', 'レイアウト', '設計', '仕様'
            ]) and line.startswith('#'):
                current_section = 'supplement'
                skip_section = False
                supplement_lines.append(line)
                continue
                
            # その他のセクション（##レベル）
            elif line.startswith('## '):
                # 項目定義セクション終了チェック
                if skip_section:
                    skip_section = False
                    current_section = 'supplement'
                elif current_section == 'conditions':
                    current_section = 'supplement'
                
                supplement_lines.append(line)
                continue
            
            # テーブル形式をスキップ（|で始まる行）
            elif line.strip().startswith('|') and '|' in line:
                # 項目定義のテーブル行をスキップ
                continue
                
            # セクション境界での空行処理
            elif line.strip() == '' and skip_section:
                continue
            
            # 内容を適切なセクションに振り分け
            if current_section == 'conditions' and not skip_section:
                conditions_lines.append(line)
            elif current_section == 'supplement' and not skip_section:
                supplement_lines.append(line)
        
        # conditionsが空の場合は簡単な条件を生成
        if not conditions_lines:
            conditions = """## 表示条件
- ログインしているユーザーのみ利用可能
- 適切な権限を持つユーザーのみアクセス可能"""
        else:
            conditions = '\n'.join(conditions_lines).strip()
        
        # supplementから不要な部分を除去
        supplement_text = '\n'.join(supplement_lines).strip()
        
        # タイトルが重複している場合は除去
        if supplement_text.startswith('# '):
            supplement_lines_filtered = supplement_text.split('\n')[1:]
            supplement = '\n'.join(supplement_lines_filtered).strip()
        else:
            supplement = supplement_text
        
        return conditions, supplement

    def _extract_from_text(self, text: str, target_type: str) -> Dict[str, Any]:
        """テキストから設計書データを抽出（WebUI GeneratedDraft形式）"""
        
        # 基本的なスプレッドシートデータを生成
        if target_type == 'screen':
            table_data = [
                {"項目名": "ユーザーID", "データ型": "string", "必須": "○", "説明": "ユーザーを識別するID"},
                {"項目名": "ユーザー名", "データ型": "string", "必須": "○", "説明": "表示用のユーザー名"},
                {"項目名": "メールアドレス", "データ型": "email", "必須": "○", "説明": "ログイン用メールアドレス"}
            ]
        elif target_type == 'api':
            table_data = [
                {"項目名": "user_id", "データ型": "string", "必須": "○", "説明": "ユーザーID"},
                {"項目名": "name", "データ型": "string", "必須": "○", "説明": "ユーザー名"},
                {"項目名": "email", "データ型": "string", "必須": "○", "説明": "メールアドレス"}
            ]
        else:  # model
            table_data = [
                {"項目名": "id", "データ型": "bigint", "必須": "○", "説明": "プライマリキー"},
                {"項目名": "name", "データ型": "varchar(255)", "必須": "○", "説明": "名前"},
                {"項目名": "created_at", "データ型": "timestamp", "必須": "○", "説明": "作成日時"}
            ]
        
        # Markdownコンテンツを生成
        markdown_content = f"""# {target_type.title()}設計書

## 概要
{text[:200]}...

## 生成情報
- 生成日時: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
- 生成方式: AI動的生成（MCP Server）

## 詳細
AI生成による基本的な設計書です。必要に応じて項目を追加・修正してください。
"""
        
        # WebUI GeneratedDraft形式に変換
        spreadsheet_cells = self._convert_table_to_cells(table_data)
        conditions, supplement = self._split_markdown_content(markdown_content)
        
        return {
            "type": "mixed",
            "spreadsheetData": spreadsheet_cells,
            "conditions": conditions or markdown_content,
            "supplement": supplement
        }
    
    async def _generate_fallback_design_draft(
        self,
        prompt: str,
        target_type: str,
        project_context: Optional[Dict]
    ) -> Dict[str, Any]:
        """AI生成失敗時のフォールバック設計書ドラフト（WebUI GeneratedDraft形式）"""
        
        table_data = [
            {"項目名": "エラー", "データ型": "string", "必須": "○", "説明": f"生成エラー: AI APIに接続できませんでした"}
        ]
        
        markdown_content = f"""# {target_type.title()}設計書（フォールバック）

## ⚠️ 生成エラー
AI生成に失敗したため、基本的な設計書を表示しています。

### エラー詳細
- 発生日時: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
- プロンプト: {prompt}
- 対象タイプ: {target_type}

### 対処方法
1. AI API設定を確認してください
2. ネットワーク接続を確認してください
3. しばらく時間をおいて再度お試しください

AI生成の復旧後、再度生成要求を送信してください。
"""
        
        # WebUI GeneratedDraft形式に変換
        spreadsheet_cells = self._convert_table_to_cells(table_data)
        conditions, supplement = self._split_markdown_content(markdown_content)
        
        return {
            "type": "mixed",
            "spreadsheetData": spreadsheet_cells,
            "conditions": conditions or markdown_content,
            "supplement": supplement,
            "metadata": {
                "generated_at": datetime.now().isoformat(),
                "prompt_used": prompt,
                "mode": "fallback",
                "target_type": target_type,
                "project_context": project_context,
                "server_version": "0.1.0",
                "generation_type": "fallback_design_draft",
                "ai_provider": "none"
            }
        }
    
    async def _generate_fallback_data(
        self, 
        prompt: str, 
        project_context: Optional[Dict], 
        references: Optional[list]
    ) -> Dict[str, Any]:
        """AI生成失敗時のフォールバックデータ"""
        
        fallback_mermaid = """erDiagram
    USER {
        string id PK
        string name
        string email
        datetime created_at
        datetime updated_at
    }
    
    PROJECT {
        string id PK
        string name
        string description
        string owner_id FK
        datetime created_at
        datetime updated_at
    }
    
    DOCUMENT {
        string id PK
        string project_id FK
        string name
        string type
        json content
        datetime created_at
        datetime updated_at
    }
    
    USER ||--o{ PROJECT : owns
    PROJECT ||--o{ DOCUMENT : contains"""
        
        fallback_supplement = f"""## データモデル設計書（フォールバック）

### 生成情報
- **生成日時**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
- **プロンプト**: {prompt}
- **生成方式**: フォールバック（AI生成失敗）

### ⚠️ 注意
AI生成に失敗したため、基本的なデータモデルを表示しています。
以下を確認してください：

1. **API設定**: 環境変数でAIサービスの認証情報が設定されているか
2. **ネットワーク**: インターネット接続が正常か
3. **サービス状況**: AI APIサービスが利用可能か

### 基本モデル説明
- **USER**: システム利用者
- **PROJECT**: 設計プロジェクト  
- **DOCUMENT**: 設計書

AI生成の復旧後、再度生成要求を送信してください。
"""
        
        return {
            "mermaidCode": fallback_mermaid,
            "supplement": fallback_supplement,
            "metadata": {
                "generated_at": datetime.now().isoformat(),
                "prompt_used": prompt,
                "mode": "fallback",
                "project_context": project_context,
                "references": references or [],
                "server_version": "0.1.0",
                "generation_type": "fallback_mermaid",
                "ai_provider": "none"
            }
        }
    
    async def generate_mockup_html(
        self,
        prompt: str,
        context: Optional[Dict] = None,
        project_context: Optional[Dict] = None
    ) -> str:
        """
        AI画面イメージHTML+CSS生成
        
        Args:
            prompt: 画面生成用プロンプト
            context: WebUIデータコンテキスト
            project_context: プロジェクト情報
            
        Returns:
            生成されたHTML+CSS文字列
        """
        
        print(f"🎨 AI HTML生成要求:")
        print(f"   プロンプト: {prompt[:100]}...")
        print(f"   プロジェクト: {project_context.get('name', '不明') if project_context else '不明'}")
        
        # HTML生成用の詳細プロンプト
        html_prompt = f"""
以下の要求に基づいて、完全にスタンドアロンで動作するHTML+CSSの画面イメージを生成してください。

【重要な制約】
- 外部画像URL（via.placeholder.com等）は絶対に使用しないでください
- 画像が必要な場合はCSS Gradient、SVG、Unicode文字（絵文字）、背景色のみを使用してください
- インターネット接続が不要で完全にスタンドアロンで動作するHTMLにしてください
- レスポンシブデザインを適用してください
- モダンなCSSスタイルを使用してください

【要求内容】
{prompt}

【WebUIコンテキスト】
- 表示条件: {context.get('conditionsMarkdown', '指定なし') if context else '指定なし'}
- 項目定義: {len(context.get('spreadsheetData', [])) if context else 0}件

【出力形式】
HTML+CSSのみを返してください。説明文は不要です。
"""
        
        try:
            # 利用可能なAIプロバイダーでHTML生成を試行
            for provider_name in self.ai_providers:
                try:
                    print(f"🤖 {provider_name}でHTML生成を試行中...")
                    
                    if provider_name == 'bedrock':
                        import boto3
                        bedrock = boto3.client(
                            'bedrock-runtime',
                            aws_access_key_id=self.aws_access_key,
                            aws_secret_access_key=self.aws_secret_key,
                            region_name=self.aws_region
                        )
                        
                        # Claude 3.5 SonnetでHTML生成
                        request_body = {
                            "anthropic_version": "bedrock-2023-05-31",
                            "max_tokens": 4000,
                            "temperature": 0.7,
                            "messages": [{
                                "role": "user",
                                "content": html_prompt
                            }]
                        }
                        
                        response = bedrock.invoke_model(
                            modelId='anthropic.claude-3-5-sonnet-20241022-v2:0',
                            body=json.dumps(request_body)
                        )
                        
                        response_body = json.loads(response['body'].read())
                        html_result = response_body['content'][0]['text'].strip()
                        
                    elif provider_name == 'openai':
                        import openai
                        client = openai.OpenAI(api_key=self.openai_api_key)
                        
                        response = client.chat.completions.create(
                            model="gpt-4",
                            messages=[{
                                "role": "user",
                                "content": html_prompt
                            }],
                            max_tokens=4000,
                            temperature=0.7
                        )
                        
                        html_result = response.choices[0].message.content.strip()
                    
                    # HTML部分のみを抽出
                    if '```html' in html_result:
                        html_start = html_result.find('```html') + 7
                        html_end = html_result.find('```', html_start)
                        if html_end != -1:
                            html_result = html_result[html_start:html_end].strip()
                    elif '```' in html_result:
                        html_start = html_result.find('```') + 3
                        html_end = html_result.find('```', html_start)
                        if html_end != -1:
                            html_result = html_result[html_start:html_end].strip()
                    
                    print(f"✅ {provider_name}でHTML生成成功")
                    print(f"   HTML長: {len(html_result)} 文字")
                    return html_result
                    
                except Exception as e:
                    print(f"❌ {provider_name}でHTML生成失敗: {e}")
                    continue
            
            # 全プロバイダーで失敗した場合はフォールバックHTML
            print("🔄 全AIプロバイダーで失敗、フォールバックHTMLを使用")
            return await self._generate_fallback_html(prompt, context, project_context)
            
        except Exception as e:
            print(f"❌ HTML生成で予期しないエラー: {e}")
            return await self._generate_fallback_html(prompt, context, project_context)
    
    async def _generate_fallback_html(
        self,
        prompt: str,
        context: Optional[Dict] = None,
        project_context: Optional[Dict] = None
    ) -> str:
        """AI生成失敗時のフォールバックHTML"""
        
        # 項目定義から簡単なテーブルを生成
        table_rows = ""
        if context and context.get('spreadsheetData'):
            spreadsheet_data = context['spreadsheetData']
            if len(spreadsheet_data) > 0:
                # 最初のシートのセルデータから項目を抽出
                cells = spreadsheet_data[0].get('celldata', [])
                if cells:
                    # 行別にデータを整理
                    rows = {}
                    for cell in cells:
                        row = cell.get('r', 0)
                        col = cell.get('c', 0)
                        value = cell.get('v', {})
                        if isinstance(value, dict):
                            cell_value = value.get('v', '')
                        else:
                            cell_value = value
                        
                        if row not in rows:
                            rows[row] = {}
                        rows[row][col] = str(cell_value)
                    
                    # ヘッダー以外の行をテーブル行として追加
                    for row_num in sorted(rows.keys()):
                        if row_num > 0:  # ヘッダー行をスキップ
                            row_data = rows[row_num]
                            cells_html = ""
                            for col in range(4):  # 項目名、データ型、必須、説明
                                cell_value = row_data.get(col, "")
                                cells_html += f"<td>{cell_value}</td>"
                            table_rows += f"<tr>{cells_html}</tr>"
        
        if not table_rows:
            table_rows = """
                <tr><td>ユーザーID</td><td>string</td><td>○</td><td>ユーザーの一意識別子</td></tr>
                <tr><td>ユーザー名</td><td>string</td><td>○</td><td>ユーザーの表示名</td></tr>
                <tr><td>メールアドレス</td><td>email</td><td>○</td><td>連絡用メールアドレス</td></tr>
            """
        
        fallback_html = f"""
<style>
  .ai-mockup-container {{ 
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 32px; 
    border-radius: 16px; 
    color: #1f2937;
    max-width: 800px;
    margin: 0 auto;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  }}
  .ai-mockup-content {{
    background: rgba(255, 255, 255, 0.95);
    padding: 24px;
    border-radius: 12px;
    backdrop-filter: blur(10px);
  }}
  .ai-mockup-title {{ 
    font-size: 2rem; 
    font-weight: 700; 
    margin-bottom: 8px; 
    color: #1e40af;
    text-align: center;
  }}
  .ai-mockup-subtitle {{
    text-align: center;
    color: #6b7280;
    margin-bottom: 24px;
    font-size: 1.1rem;
  }}
  .ai-mockup-table {{ 
    width: 100%; 
    border-collapse: collapse; 
    margin-bottom: 24px;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }}
  .ai-mockup-table th {{ 
    background: linear-gradient(135deg, #3b82f6, #1e40af);
    color: white;
    padding: 16px 12px;
    font-weight: 600;
    text-align: left;
    font-size: 0.9rem;
  }}
  .ai-mockup-table td {{ 
    border-bottom: 1px solid #e5e7eb;
    padding: 12px;
    background: rgba(255, 255, 255, 0.8);
  }}
  .ai-mockup-table tr:hover td {{
    background: rgba(59, 130, 246, 0.1);
  }}
  .ai-mockup-buttons {{
    display: flex;
    gap: 12px;
    justify-content: center;
    flex-wrap: wrap;
  }}
  .ai-mockup-button {{ 
    background: linear-gradient(135deg, #10b981, #059669);
    color: #fff; 
    border: none; 
    border-radius: 8px; 
    padding: 12px 24px; 
    font-size: 1rem; 
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }}
  .ai-mockup-button:hover {{
    transform: translateY(-1px);
    box-shadow: 0 6px 8px -1px rgba(0, 0, 0, 0.15);
  }}
  .ai-mockup-input {{ 
    border: 2px solid #d1d5db; 
    border-radius: 8px; 
    padding: 12px 16px;
    font-size: 1rem;
    margin-right: 12px;
    margin-bottom: 12px;
    transition: border-color 0.2s;
    background: rgba(255, 255, 255, 0.9);
  }}
  .ai-mockup-input:focus {{
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }}
  .ai-mockup-warning {{
    background: rgba(251, 146, 60, 0.1);
    border: 1px solid #f59e0b;
    padding: 16px;
    border-radius: 8px;
    margin-bottom: 16px;
    color: #92400e;
    font-size: 0.9rem;
  }}
  .ai-mockup-warning strong {{
    color: #b45309;
  }}
</style>
<div class="ai-mockup-container">
  <div class="ai-mockup-content">
    <div class="ai-mockup-title">🚀 管理画面</div>
    <div class="ai-mockup-subtitle">データ管理システム</div>
    
    <div class="ai-mockup-warning">
      <strong>⚠️ フォールバック表示:</strong> AI生成に失敗したため、基本的な画面を表示しています。
      AI API設定を確認してください。
    </div>
    
    <table class="ai-mockup-table">
      <thead>
        <tr>
          <th>📋 項目名</th>
          <th>🔧 データ型</th>
          <th>✅ 必須</th>
          <th>📝 説明</th>
        </tr>
      </thead>
      <tbody>
        {table_rows}
      </tbody>
    </table>
    
    <div class="ai-mockup-buttons">
      <input class="ai-mockup-input" placeholder="新しい項目を入力..." />
      <button class="ai-mockup-button">➕ 追加</button>
      <button class="ai-mockup-button">✏️ 編集</button>
      <button class="ai-mockup-button">🗑️ 削除</button>
    </div>
  </div>
</div>
"""
        
        return fallback_html
    
    async def generate_modification_proposal(
        self,
        system_prompt: str,
        user_prompt: str,
        context: Optional[Dict] = None,
        project_context: Optional[Dict] = None
    ) -> str:
        """
        AI修正提案生成
        
        Args:
            system_prompt: システムプロンプト（修正提案生成用）
            user_prompt: ユーザープロンプト（修正要求）
            context: WebUIデータコンテキスト
            project_context: プロジェクト情報
            
        Returns:
            生成された修正提案テキスト
        """
        
        print(f"🔧 AI修正提案生成要求:")
        print(f"   システムプロンプト: {system_prompt[:100]}...")
        print(f"   ユーザープロンプト: {user_prompt[:100]}...")
        print(f"   プロジェクト: {project_context.get('name', '不明') if project_context else '不明'}")
        
        try:
            # 利用可能なAIプロバイダーで修正提案生成を試行
            for provider_name in self.ai_providers:
                try:
                    print(f"🤖 {provider_name}で修正提案生成を試行中...")
                    
                    if provider_name == 'bedrock':
                        import boto3
                        bedrock = boto3.client(
                            'bedrock-runtime',
                            aws_access_key_id=self.aws_access_key,
                            aws_secret_access_key=self.aws_secret_key,
                            region_name=self.aws_region
                        )
                        
                        # Claude 3.5 Sonnetで修正提案生成
                        request_body = {
                            "anthropic_version": "bedrock-2023-05-31",
                            "max_tokens": 3000,
                            "temperature": 0.3,
                            "messages": [{
                                "role": "user",
                                "content": f"{system_prompt}\n\n{user_prompt}"
                            }]
                        }
                        
                        response = bedrock.invoke_model(
                            modelId='anthropic.claude-3-5-sonnet-20241022-v2:0',
                            body=json.dumps(request_body)
                        )
                        
                        response_body = json.loads(response['body'].read())
                        proposal_result = response_body['content'][0]['text'].strip()
                        
                    elif provider_name == 'openai':
                        import openai
                        client = openai.OpenAI(api_key=self.openai_api_key)
                        
                        response = client.chat.completions.create(
                            model="gpt-4",
                            messages=[{
                                "role": "system",
                                "content": system_prompt
                            }, {
                                "role": "user",
                                "content": user_prompt
                            }],
                            max_tokens=3000,
                            temperature=0.3
                        )
                        
                        proposal_result = response.choices[0].message.content.strip()
                    
                    print(f"✅ {provider_name}で修正提案生成成功")
                    print(f"   修正提案長: {len(proposal_result)} 文字")
                    return proposal_result
                    
                except Exception as e:
                    print(f"❌ {provider_name}で修正提案生成失敗: {e}")
                    continue
            
            # 全プロバイダーで失敗した場合はフォールバック提案
            print("🔄 全AIプロバイダーで失敗、フォールバック提案を使用")
            return await self._generate_fallback_modification_proposal(user_prompt, context, project_context)
            
        except Exception as e:
            print(f"❌ 修正提案生成で予期しないエラー: {e}")
            return await self._generate_fallback_modification_proposal(user_prompt, context, project_context)
    
    async def _generate_fallback_modification_proposal(
        self,
        user_prompt: str,
        context: Optional[Dict] = None,
        project_context: Optional[Dict] = None
    ) -> str:
        """AI生成失敗時のフォールバック修正提案"""
        
        fallback_proposal = f"""```json
{{
  "summary": "修正提案（フォールバック）",
  "changes": [
    {{
      "target": "conditions",
      "action": "modify",
      "location": "1",
      "originalContent": "現在の内容",
      "newContent": "AI生成エラーのため、手動での修正をお願いします",
      "reason": "AI APIに接続できないため、具体的な修正提案を生成できません",
      "confidence": 0.1
    }}
  ],
  "risks": [
    "AI生成に失敗したため、適切な修正提案を提供できません",
    "手動での確認と修正が必要です",
    "AI API設定の確認が必要です"
  ]
}}
```

**⚠️ 修正提案生成エラー**

AI APIに接続できないため、具体的な修正提案を生成できませんでした。

**エラー詳細:**
- 発生日時: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
- ユーザー要求: {user_prompt}
- プロジェクト: {project_context.get('name', '不明') if project_context else '不明'}

**対処方法:**
1. **API設定確認**: 環境変数でAI API認証情報が正しく設定されているか確認
2. **ネットワーク確認**: インターネット接続が正常か確認
3. **手動修正**: AIによる自動修正の代わりに手動で修正を行う
4. **再試行**: AI APIの復旧後、再度修正提案を要求する

**手動修正の参考:**
- 表示条件タブで直接Markdownを編集
- 項目定義タブでスプレッドシート形式で編集
- 補足説明タブで追加情報を記入

申し訳ございませんが、手動での修正をお願いします。"""
        
        return fallback_proposal

# シングルトンインスタンス
ai_service = AIService()