# AWS CodePipeline 並列ビルド設定ガイド

このドキュメントは、Speed Match Card Gameのフロントエンドとバックエンドを並列ビルドするためのCodePipeline設定手順です。

## 📁 ファイル構成

```
speed-match-card-game/
├── buildspec-frontend.yml    # フロントエンドビルド設定
├── buildspec-backend.yml     # バックエンドビルド設定
└── docs/
    └── codepipeline-setup.md # このファイル
```

---

## 🏗️ ビルド設定の概要

### Frontend (buildspec-frontend.yml)
- **ランタイム**: Node.js 22
- **ビルド対象**: `front/` ディレクトリ
- **成果物**: `front/dist/` の静的ファイル
- **用途**: S3 + CloudFrontへデプロイ

### Backend (buildspec-backend.yml)
- **ランタイム**: Java 21 (Amazon Corretto)
- **ビルド対象**: `api/` ディレクトリ
- **成果物**: `speed-match-card-game-api.jar` (Fat JAR)
- **用途**: ECS/EC2/Lambdaへデプロイ

---

## 🔧 AWS CodeBuild プロジェクト作成

### 1. Frontend用CodeBuildプロジェクト

```bash
# AWSコンソールまたはCLIで作成
プロジェクト名: speedmatch-frontend-build
ソース: GitHub (このリポジトリ)
環境:
  - イメージ: aws/codebuild/standard:7.0
  - コンピューティング: 3GB RAM, 2 vCPU
Buildspec: buildspec-frontend.yml
アーティファクト: speedmatch-frontend
```

### 2. Backend用CodeBuildプロジェクト

```bash
# AWSコンソールまたはCLIで作成
プロジェクト名: speedmatch-backend-build
ソース: GitHub (このリポジトリ)
環境:
  - イメージ: aws/codebuild/standard:7.0
  - コンピューティング: 7GB RAM, 4 vCPU (Gradleビルド用)
Buildspec: buildspec-backend.yml
アーティファクト: speedmatch-backend
```

---

## 🔄 CodePipeline 設定

### Pipeline構成

```yaml
Pipeline名: speedmatch-deployment

Stages:
  1. Source:
      - GitHub連携でコード取得
      
  2. Build (並列実行):
      - Action 1: BuildFrontend
        - CodeBuild: speedmatch-frontend-build
        - RunOrder: 1
        - 入力: SourceArtifact
        - 出力: FrontendArtifact
        
      - Action 2: BuildBackend
        - CodeBuild: speedmatch-backend-build
        - RunOrder: 1  # 同じRunOrderで並列実行
        - 入力: SourceArtifact
        - 出力: BackendArtifact
        
  3. Deploy (並列実行可能):
      - Action 1: DeployFrontend
        - S3へデプロイ + CloudFront無効化
        - RunOrder: 1
        - 入力: FrontendArtifact
        
      - Action 2: DeployBackend
        - ECS/EC2/Lambdaへデプロイ
        - RunOrder: 1  # 並列デプロイ
        - 入力: BackendArtifact
```

---

## 📝 CloudFormation テンプレート例

<details>
<summary>クリックして展開</summary>

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Speed Match Card Game - CI/CD Pipeline'

Parameters:
  GitHubRepo:
    Type: String
    Default: 'SeiyaIwabuchi/speed-match-card-game'
  GitHubBranch:
    Type: String
    Default: 'main'

Resources:
  # S3 Bucket for Artifacts
  ArtifactBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'speedmatch-artifacts-${AWS::AccountId}'
      VersioningConfiguration:
        Status: Enabled

  # CodeBuild Project - Frontend
  FrontendBuildProject:
    Type: AWS::CodeBuild::Project
    Properties:
      Name: speedmatch-frontend-build
      ServiceRole: !GetAtt CodeBuildRole.Arn
      Artifacts:
        Type: CODEPIPELINE
      Environment:
        Type: LINUX_CONTAINER
        ComputeType: BUILD_GENERAL1_SMALL
        Image: aws/codebuild/standard:7.0
      Source:
        Type: CODEPIPELINE
        BuildSpec: buildspec-frontend.yml
      Cache:
        Type: S3
        Location: !Sub '${ArtifactBucket}/build-cache/frontend'

  # CodeBuild Project - Backend
  BackendBuildProject:
    Type: AWS::CodeBuild::Project
    Properties:
      Name: speedmatch-backend-build
      ServiceRole: !GetAtt CodeBuildRole.Arn
      Artifacts:
        Type: CODEPIPELINE
      Environment:
        Type: LINUX_CONTAINER
        ComputeType: BUILD_GENERAL1_MEDIUM
        Image: aws/codebuild/standard:7.0
      Source:
        Type: CODEPIPELINE
        BuildSpec: buildspec-backend.yml
      Cache:
        Type: S3
        Location: !Sub '${ArtifactBucket}/build-cache/backend'

  # CodePipeline
  Pipeline:
    Type: AWS::CodePipeline::Pipeline
    Properties:
      Name: speedmatch-pipeline
      RoleArn: !GetAtt CodePipelineRole.Arn
      ArtifactStore:
        Type: S3
        Location: !Ref ArtifactBucket
      Stages:
        # Source Stage
        - Name: Source
          Actions:
            - Name: SourceAction
              ActionTypeId:
                Category: Source
                Owner: AWS
                Provider: CodeStarSourceConnection
                Version: '1'
              Configuration:
                ConnectionArn: !Ref GitHubConnection
                FullRepositoryId: !Ref GitHubRepo
                BranchName: !Ref GitHubBranch
              OutputArtifacts:
                - Name: SourceArtifact
        
        # Build Stage (Parallel)
        - Name: Build
          Actions:
            - Name: BuildFrontend
              ActionTypeId:
                Category: Build
                Owner: AWS
                Provider: CodeBuild
                Version: '1'
              Configuration:
                ProjectName: !Ref FrontendBuildProject
              InputArtifacts:
                - Name: SourceArtifact
              OutputArtifacts:
                - Name: FrontendArtifact
              RunOrder: 1
              
            - Name: BuildBackend
              ActionTypeId:
                Category: Build
                Owner: AWS
                Provider: CodeBuild
                Version: '1'
              Configuration:
                ProjectName: !Ref BackendBuildProject
              InputArtifacts:
                - Name: SourceArtifact
              OutputArtifacts:
                - Name: BackendArtifact
              RunOrder: 1  # 並列実行
        
        # Deploy Stage (Parallel)
        - Name: Deploy
          Actions:
            - Name: DeployFrontend
              ActionTypeId:
                Category: Deploy
                Owner: AWS
                Provider: S3
                Version: '1'
              Configuration:
                BucketName: !Ref FrontendBucket
                Extract: true
              InputArtifacts:
                - Name: FrontendArtifact
              RunOrder: 1
              
            # Backend Deploy (ECS/EC2/Lambda等)
            # 実際のデプロイ先に応じて設定

  # IAM Roles
  CodeBuildRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: codebuild.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/AWSCodeBuildAdminAccess'
      Policies:
        - PolicyName: CodeBuildPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:PutObject'
                Resource: !Sub '${ArtifactBucket}/*'

  CodePipelineRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: codepipeline.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/AWSCodePipelineFullAccess'

  # Frontend Hosting Bucket
  FrontendBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'speedmatch-frontend-${AWS::AccountId}'
      WebsiteConfiguration:
        IndexDocument: index.html
        ErrorDocument: index.html

  # GitHub Connection
  GitHubConnection:
    Type: AWS::CodeStarConnections::Connection
    Properties:
      ConnectionName: speedmatch-github
      ProviderType: GitHub

Outputs:
  PipelineUrl:
    Value: !Sub 'https://console.aws.amazon.com/codesuite/codepipeline/pipelines/${Pipeline}/view'
  FrontendUrl:
    Value: !GetAtt FrontendBucket.WebsiteURL
```

</details>

---

## 🚀 デプロイ手順

### 1. GitHubへプッシュ

```bash
git add buildspec-frontend.yml buildspec-backend.yml
git commit -m "Add parallel build configuration for CodePipeline"
git push origin main
```

### 2. CloudFormationスタック作成

```bash
aws cloudformation create-stack \
  --stack-name speedmatch-cicd \
  --template-body file://cloudformation/pipeline.yml \
  --capabilities CAPABILITY_IAM
```

### 3. GitHub接続の認証

- AWSコンソール > Developer Tools > Connections
- `speedmatch-github` の接続を承認

### 4. パイプライン実行

- 自動: GitHubへのpushで自動実行
- 手動: AWSコンソールから「リリースの変更」

---

## 📊 ビルド時間の比較

### 従来（順次実行）
```
Frontend: 3分
Backend: 5分
合計: 8分
```

### 並列実行後
```
Frontend: 3分 ┐
Backend: 5分  ┘ → 最長が5分
合計: 5分（3分の時短）
```

---

## 🔍 トラブルシューティング

### Backend ビルドエラー

```bash
# ローカルで確認
cd api
./gradlew clean build
./gradlew shadowJar

# JARファイル確認
ls -la build/libs/
```

### Frontend ビルドエラー

```bash
# ローカルで確認
cd front
npm ci
npm run build

# dist確認
ls -la dist/
```

### CodeBuild ログ確認

```bash
# AWS CLIで最新のビルドログを取得
aws codebuild batch-get-builds \
  --ids $(aws codebuild list-builds-for-project \
    --project-name speedmatch-frontend-build \
    --query 'ids[0]' --output text)
```

---

## 📚 関連ドキュメント

- [AWS CodePipeline ドキュメント](https://docs.aws.amazon.com/codepipeline/)
- [AWS CodeBuild ドキュメント](https://docs.aws.amazon.com/codebuild/)
- [Shadow Plugin ドキュメント](https://github.com/johnrengelman/shadow)

---

## ✅ チェックリスト

- [ ] `buildspec-frontend.yml` をリポジトリに追加
- [ ] `buildspec-backend.yml` をリポジトリに追加
- [ ] `api/build.gradle.kts` にShadowプラグイン追加
- [ ] CodeBuildプロジェクト2つ作成
- [ ] CodePipeline作成（並列Build設定）
- [ ] GitHub接続認証
- [ ] 初回ビルド実行・確認
- [ ] デプロイステージ設定

---

**作成日**: 2025-10-12  
**プロジェクト**: Speed Match Card Game  
**担当**: DevOps Team
