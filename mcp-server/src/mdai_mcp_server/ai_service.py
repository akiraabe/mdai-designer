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

# シングルトンインスタンス
ai_service = AIService()