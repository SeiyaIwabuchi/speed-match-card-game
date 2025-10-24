# コードスタイルと規約

## アーキテクチャ原則
**クリーンアーキテクチャ**に基づく開発
- 依存性の逆転: 内側レイヤーは外側に依存しない
- 関心の分離: 各レイヤーが明確な責任を持つ
- テスタビリティ: ビジネスロジックを独立してテスト可能
- フレームワーク非依存: ビジネスロジックはKtorに依存しない

## 依存性の方向
```
Presentation → Application → Domain ← Infrastructure
```
- リポジトリインターフェースは**Domain層**で定義
- 実装は**Infrastructure層**で提供

## 命名規則

### クラス・インターフェース
- **UseCase**: `〜UseCase` (例: `CreatePlayerUseCase`)
- **Repository**: `〜Repository` (インターフェース), `〜RepositoryImpl` (実装)
- **Entity**: 名詞 (例: `Player`, `Room`, `Game`)
- **Value Object**: 名詞 (例: `PlayerId`, `RoomCode`, `PlayerName`)
- **Domain Service**: `〜Service` (例: `GameRuleService`)
- **DTO**: `〜Request`, `〜Response`, `〜Dto`
- **Exception**: `〜Exception` (例: `PlayerNotFoundException`)

### パッケージ構成
機能ごとにサブパッケージを作成:
```
application/usecase/player/
application/usecase/room/
application/usecase/game/
```

## Kotlinスタイル

### データクラス
- **イミュータブル**を基本とする (val使用)
- 状態変更は`copy()`で新インスタンスを返す

```kotlin
data class Player(
    val id: PlayerId,
    val name: PlayerName,
    val statistics: PlayerStatistics
) {
    fun recordWin(): Player = copy(
        statistics = statistics.addWin()
    )
}
```

### 値オブジェクト
- `@JvmInline value class`を使用
- ビジネスルールをコンストラクタで検証

```kotlin
@JvmInline
value class PlayerName private constructor(val value: String) {
    companion object {
        fun create(value: String): PlayerName {
            require(value.trim().length in 3..12) {
                "Player name must be 3-12 characters"
            }
            return PlayerName(value.trim())
        }
    }
}
```

### 例外処理
- ドメイン例外は`sealed class`で定義
- 意味のある例外名を使用

```kotlin
sealed class DomainException(message: String) : Exception(message)
class PlayerNotFoundException(message: String) : DomainException(message)
class DuplicatePlayerNameException(message: String) : DomainException(message)
```

## Ktorパターン

### プラグイン設定
- `Application.kt`から小さな`configure*()`関数を呼び出す
- 各プラグインは`presentation/plugin/`に分離

```kotlin
fun Application.module() {
    configureLogging()
    configureSerialization()
    configureCORS()
    configureDatabase()
    configureSwagger()
    configureRouting()
}
```

### ルーティング
- `presentation/routes/`に機能ごとに分割
- ユースケースを引数で受け取る

```kotlin
fun Route.playerRoutes(
    createPlayerUseCase: CreatePlayerUseCase,
    getPlayerUseCase: GetPlayerUseCase
) {
    route("/players") {
        post { /* ... */ }
        get("/{id}") { /* ... */ }
    }
}
```

### エラーハンドリング
- ドメイン例外をキャッチしてHTTPステータスコードに変換
- `ErrorResponse` DTOで統一

```kotlin
try {
    val player = createPlayerUseCase.execute(name, emoji)
    call.respond(HttpStatusCode.Created, PlayerMapper.toResponse(player))
} catch (e: DomainException) {
    call.respond(
        HttpStatusCode.BadRequest,
        ErrorResponse(e.message ?: "Invalid request")
    )
}
```

## データベースパターン (Exposed ORM)

### テーブル定義
- `object`でシングルトン定義
- `java.time.Instant`を使用

```kotlin
object Players : Table("players") {
    val id = uuid("id")
    val name = varchar("name", 50).uniqueIndex()
    val createdAt = timestamp("created_at").default(Instant.now())
    override val primaryKey = PrimaryKey(id)
}
```

### リポジトリ実装
- `newSuspendedTransaction`でコルーチン対応
- 拡張関数で`ResultRow → Entity`変換

```kotlin
override suspend fun findById(id: PlayerId): Player? = newSuspendedTransaction {
    Players.select { Players.id eq id.value }
        .singleOrNull()
        ?.toPlayer()
}

private fun ResultRow.toPlayer(): Player = Player(
    id = PlayerId(this[Players.id]),
    name = PlayerName.create(this[Players.name]),
    // ...
)
```

## コメント規約

### KDoc
- パブリックAPIには必ず記述
- ビジネスルールを明記

```kotlin
/**
 * プレイヤー作成ユースケース
 * 
 * @param name プレイヤー名(3-12文字)
 * @param avatarEmoji アバター絵文字
 * @return 作成されたプレイヤー
 * @throws DuplicatePlayerNameException 名前が既に存在する場合
 */
suspend fun execute(name: String, avatarEmoji: String): Player
```

### インラインコメント
- **なぜそうしたか**を記述 (何をしているかは明白にする)
- ビジネスルール検証箇所には必ずコメント

```kotlin
// ビジネスルール: 名前の重複チェック
if (playerRepository.existsByName(playerName)) {
    throw DuplicatePlayerNameException("Player name already exists")
}
```

## テストパターン
- **Domain層**: 100%カバレッジ目標
- **Application層**: MockKでモック使用
- **Infrastructure層**: インテグレーションテスト (H2などテストDB)

## 定数・設定
- マジックナンバーは定数化
- `companion object`で定義

```kotlin
companion object {
    private const val MIN_LENGTH = 3
    private const val MAX_LENGTH = 12
}
```

## ファイル構成
- 1ファイル1クラスが基本
- 関連する小さなクラス(DTOなど)は同一ファイル可
