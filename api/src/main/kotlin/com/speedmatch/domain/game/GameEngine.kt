package com.speedmatch.domain.game

import java.util.UUID

/**
 * ゲームエンジン - ゲームロジックの中核
 */
class GameEngine {
    companion object {
        private const val INITIAL_HAND_SIZE = 7
        private const val FIELD_CARDS_COUNT = 2
        private const val MIN_PLAYERS = 2
        private const val MAX_PLAYERS = 4

        /**
         * 新しいゲームを初期化
         * 
         * @param roomId ルームID
         * @param playerIds プレイヤーIDのリスト（2-4人）
         * @return 初期化されたゲーム状態
         * @throws IllegalArgumentException プレイヤー数が不正な場合
         */
        fun initializeGame(roomId: String, playerIds: List<String>): GameState {
            require(playerIds.size in MIN_PLAYERS..MAX_PLAYERS) {
                "プレイヤー数は${MIN_PLAYERS}～${MAX_PLAYERS}人である必要があります"
            }

            // デッキを作成してシャッフル
            val shuffledDeck = Card.createDeck().shuffled()

            // 各プレイヤーに7枚ずつ配る
            val hands = mutableMapOf<String, List<Card>>()
            var deckIndex = 0

            playerIds.forEach { playerId ->
                val hand = shuffledDeck.subList(deckIndex, deckIndex + INITIAL_HAND_SIZE)
                hands[playerId] = hand
                deckIndex += INITIAL_HAND_SIZE
            }

            // 場札を2枚設定
            val fieldCard1 = shuffledDeck[deckIndex]
            val fieldCard2 = shuffledDeck[deckIndex + 1]
            deckIndex += FIELD_CARDS_COUNT

            // 残りを山札に
            val remainingDeck = shuffledDeck.subList(deckIndex, shuffledDeck.size)

            // プレイヤー状態を作成
            val players = playerIds.map { playerId ->
                PlayerState(
                    playerId = playerId,
                    hand = hands[playerId]!!
                )
            }

            // ゲーム状態を作成
            return GameState(
                gameId = "game_${UUID.randomUUID()}",
                roomId = roomId,
                players = players,
                deck = remainingDeck,
                fieldCards = Pair(fieldCard1, fieldCard2),
                currentPlayerIndex = 0,
                turnOrder = playerIds,
                status = GameStatus.PLAYING
            )
        }

        /**
         * カードをプレイ
         * 
         * @param state 現在のゲーム状態
         * @param playerId プレイヤーID
         * @param card プレイするカード
         * @param targetField どちらの場札に出すか（0 or 1）
         * @return 更新されたゲーム状態
         * @throws IllegalArgumentException 不正なプレイの場合
         */
        fun playCard(
            state: GameState,
            playerId: String,
            card: Card,
            targetField: Int
        ): GameState {
            // プレイヤーのターンか確認
            require(state.currentPlayerId == playerId) {
                "あなたのターンではありません"
            }

            // カードが手札にあるか確認
            val playerHand = state.getPlayerHand(playerId) 
                ?: throw IllegalArgumentException("プレイヤーが見つかりません")
            require(card in playerHand) {
                "指定されたカードは手札にありません"
            }

            // 場札のインデックスを確認
            require(targetField in 0..1) {
                "場札は0または1を指定してください"
            }

            // カードが出せるか確認
            val targetFieldCard = if (targetField == 0) state.fieldCards.first else state.fieldCards.second
            require(Card.isValidMove(card, targetFieldCard)) {
                "そのカードは場札に出せません"
            }

            // 手札から削除
            val newHand = playerHand - card

            // 場札を更新
            val newFieldCards = if (targetField == 0) {
                Pair(card, state.fieldCards.second)
            } else {
                Pair(state.fieldCards.first, card)
            }

            // 状態を更新
            var newState = state
                .updatePlayerHand(playerId, newHand)
                .updateFieldCards(newFieldCards)

            // 勝利チェック
            if (newState.checkWinCondition(playerId)) {
                newState = newState.updateStatus(GameStatus.FINISHED)
            } else {
                // 次のターンへ
                newState = newState.nextTurn()
            }

            return newState
        }

        /**
         * カードを引く
         * 
         * @param state 現在のゲーム状態
         * @param playerId プレイヤーID
         * @return 更新されたゲーム状態
         * @throws IllegalArgumentException 不正なアクションの場合
         */
        fun drawCard(state: GameState, playerId: String): GameState {
            // プレイヤーのターンか確認
            require(state.currentPlayerId == playerId) {
                "あなたのターンではありません"
            }

            // プレイ可能なカードがないか確認
            val playableCards = state.getPlayableCards(playerId)
            require(playableCards.isEmpty()) {
                "プレイ可能なカードがあります: ${playableCards.joinToString { it.id }}"
            }

            // 山札が空の場合
            if (state.deck.isEmpty()) {
                // ターンをスキップ
                return state.nextTurn()
            }

            // カードを引く
            val drawnCard = state.deck.first()
            val newDeck = state.deck.drop(1)

            val playerHand = state.getPlayerHand(playerId) 
                ?: throw IllegalArgumentException("プレイヤーが見つかりません")
            val newHand = playerHand + drawnCard

            // 状態を更新してターンを進める
            return state
                .updateDeck(newDeck)
                .updatePlayerHand(playerId, newHand)
                .nextTurn()
        }

        /**
         * ターンをスキップ（山札が空でプレイ可能なカードがない場合のみ）
         * 
         * @param state 現在のゲーム状態
         * @param playerId プレイヤーID
         * @return 更新されたゲーム状態
         * @throws IllegalArgumentException 不正なアクションの場合
         */
        fun skipTurn(state: GameState, playerId: String): GameState {
            // プレイヤーのターンか確認
            require(state.currentPlayerId == playerId) {
                "あなたのターンではありません"
            }

            // プレイ可能なカードがないか確認
            val playableCards = state.getPlayableCards(playerId)
            require(playableCards.isEmpty()) {
                "プレイ可能なカードがあります: ${playableCards.joinToString { it.id }}"
            }

            // 山札が空であることを確認
            require(state.deck.isEmpty()) {
                "山札が残っています。カードを引いてください"
            }

            // ターンを進める
            return state.nextTurn()
        }

        /**
         * ゲームが行き詰まりかチェック
         * （全プレイヤーがプレイ可能なカードを持っておらず、山札も空の場合）
         * 
         * @param state ゲーム状態
         * @return 行き詰まりの場合true
         */
        fun isStalemate(state: GameState): Boolean {
            if (state.deck.isNotEmpty()) return false
            if (state.status != GameStatus.PLAYING) return false

            return state.players.all { player ->
                state.getPlayableCards(player.playerId).isEmpty()
            }
        }

        /**
         * ゲーム終了処理（行き詰まり時のランキング計算など）
         * 
         * @param state ゲーム状態
         * @return 終了処理されたゲーム状態
         */
        fun finishGame(state: GameState): GameState {
            // 手札の枚数でランキング
            val rankedPlayers = state.players
                .sortedBy { it.handSize }
                .mapIndexed { index, player ->
                    player.copy(rank = index + 1)
                }

            return state.copy(
                players = rankedPlayers,
                status = GameStatus.FINISHED,
                lastUpdatedAt = System.currentTimeMillis()
            )
        }
    }
}
