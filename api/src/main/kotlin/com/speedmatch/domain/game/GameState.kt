package com.speedmatch.domain.game

/**
 * ゲームの状態を管理するクラス
 * 
 * @property gameId ゲームID
 * @property roomId ルームID
 * @property players プレイヤーリスト
 * @property deck 山札
 * @property fieldCards 場札（2枚）
 * @property currentPlayerIndex 現在のターンプレイヤーのインデックス
 * @property turnOrder ターン順序
 * @property status ゲーム状態
 * @property startedAt ゲーム開始時刻
 */
data class GameState(
    val gameId: String,
    val roomId: String,
    val players: List<PlayerState>,
    val deck: List<Card>,
    val fieldCards: Pair<Card, Card>,
    val currentPlayerIndex: Int,
    val turnOrder: List<String>, // playerIds
    val status: GameStatus,
    val startedAt: Long = System.currentTimeMillis(),
    val lastUpdatedAt: Long = System.currentTimeMillis()
) {
    /**
     * 現在のターンプレイヤー
     */
    val currentPlayer: PlayerState
        get() = players[currentPlayerIndex]

    /**
     * 現在のターンプレイヤーID
     */
    val currentPlayerId: String
        get() = turnOrder[currentPlayerIndex]

    /**
     * 山札の残り枚数
     */
    val deckRemaining: Int
        get() = deck.size

    /**
     * 次のプレイヤーに進む
     */
    fun nextTurn(): GameState {
        val nextIndex = (currentPlayerIndex + 1) % players.size
        return copy(
            currentPlayerIndex = nextIndex,
            lastUpdatedAt = System.currentTimeMillis()
        )
    }

    /**
     * プレイヤーの手札を更新
     */
    fun updatePlayerHand(playerId: String, newHand: List<Card>): GameState {
        val updatedPlayers = players.map { player ->
            if (player.playerId == playerId) {
                player.copy(hand = newHand)
            } else {
                player
            }
        }
        return copy(
            players = updatedPlayers,
            lastUpdatedAt = System.currentTimeMillis()
        )
    }

    /**
     * 場札を更新
     */
    fun updateFieldCards(newFieldCards: Pair<Card, Card>): GameState {
        return copy(
            fieldCards = newFieldCards,
            lastUpdatedAt = System.currentTimeMillis()
        )
    }

    /**
     * 山札を更新
     */
    fun updateDeck(newDeck: List<Card>): GameState {
        return copy(
            deck = newDeck,
            lastUpdatedAt = System.currentTimeMillis()
        )
    }

    /**
     * ゲーム状態を更新
     */
    fun updateStatus(newStatus: GameStatus): GameState {
        return copy(
            status = newStatus,
            lastUpdatedAt = System.currentTimeMillis()
        )
    }

    /**
     * プレイヤーが勝利条件を満たしているか確認
     */
    fun checkWinCondition(playerId: String): Boolean {
        val player = players.find { it.playerId == playerId }
        return player?.hand?.isEmpty() == true
    }

    /**
     * 指定したプレイヤーの手札を取得
     */
    fun getPlayerHand(playerId: String): List<Card>? {
        return players.find { it.playerId == playerId }?.hand
    }

    /**
     * プレイヤーがカードを出せるか判定
     */
    fun canPlayCard(playerId: String, card: Card): Boolean {
        // 自分のターンかチェック
        if (currentPlayerId != playerId) return false

        // 手札にカードがあるかチェック
        val playerHand = getPlayerHand(playerId) ?: return false
        if (card !in playerHand) return false

        // どちらかの場札に対してカードが出せるかチェック
        return Card.isValidMove(card, fieldCards.first) || 
               Card.isValidMove(card, fieldCards.second)
    }

    /**
     * プレイ可能なカードを取得
     */
    fun getPlayableCards(playerId: String): List<Card> {
        if (currentPlayerId != playerId) return emptyList()
        
        val playerHand = getPlayerHand(playerId) ?: return emptyList()
        
        return playerHand.filter { card ->
            Card.isValidMove(card, fieldCards.first) || 
            Card.isValidMove(card, fieldCards.second)
        }
    }
}

/**
 * プレイヤーのゲーム内状態
 * 
 * @property playerId プレイヤーID
 * @property hand 手札
 * @property rank ランク（ゲーム終了時）
 */
data class PlayerState(
    val playerId: String,
    val hand: List<Card>,
    val rank: Int? = null
) {
    /**
     * 手札の枚数
     */
    val handSize: Int
        get() = hand.size
}

/**
 * ゲームの状態
 */
enum class GameStatus {
    /** ゲーム進行中 */
    PLAYING,
    
    /** ゲーム終了 */
    FINISHED,
    
    /** ゲーム中断 */
    ABORTED
}
