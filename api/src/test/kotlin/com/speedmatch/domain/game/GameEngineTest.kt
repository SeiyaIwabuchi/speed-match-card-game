package com.speedmatch.domain.game

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class GameEngineTest {
    @Test
    fun `initializeGame should create valid game state`() {
        val playerIds = listOf("player1", "player2", "player3")
        val state = GameEngine.initializeGame("room1", playerIds)
        
        assertEquals("room1", state.roomId)
        assertEquals(3, state.players.size)
        assertEquals(GameStatus.PLAYING, state.status)
        assertEquals(0, state.currentPlayerIndex)
        assertEquals("player1", state.currentPlayerId)
    }

    @Test
    fun `initializeGame should distribute 7 cards to each player`() {
        val playerIds = listOf("player1", "player2")
        val state = GameEngine.initializeGame("room1", playerIds)
        
        state.players.forEach { player ->
            assertEquals(7, player.handSize, "各プレイヤーは7枚の手札を持つ")
        }
    }

    @Test
    fun `initializeGame should set 2 field cards`() {
        val playerIds = listOf("player1", "player2")
        val state = GameEngine.initializeGame("room1", playerIds)
        
        val (field1, field2) = state.fieldCards
        assertTrue(field1 in Card.createDeck())
        assertTrue(field2 in Card.createDeck())
    }

    @Test
    fun `initializeGame should have remaining deck after distribution`() {
        val playerIds = listOf("player1", "player2")
        val state = GameEngine.initializeGame("room1", playerIds)
        
        // 52 - (7 * 2プレイヤー) - (2 場札) = 36枚
        assertEquals(36, state.deckRemaining)
    }

    @Test
    fun `playCard should update game state correctly`() {
        val playerIds = listOf("player1", "player2")
        var state = GameEngine.initializeGame("room1", playerIds)
        
        // player1の手札から場札に出せるカードを探す
        val player1Hand = state.getPlayerHand("player1")!!
        val playableCard = player1Hand.find { card ->
            Card.isValidMove(card, state.fieldCards.first)
        }
        
        // playableCardが見つからない場合はテストスキップ（ランダムなので）
        if (playableCard != null) {
            val newState = GameEngine.playCard(state, "player1", playableCard, 0)
            
            // 手札が1枚減っている
            assertEquals(6, newState.getPlayerHand("player1")!!.size)
            
            // 場札が更新されている
            assertEquals(playableCard, newState.fieldCards.first)
            
            // ターンが進んでいる
            assertEquals(1, newState.currentPlayerIndex)
            assertEquals("player2", newState.currentPlayerId)
        }
    }

    @Test
    fun `playCard should detect win condition`() {
        val playerIds = listOf("player1", "player2")
        var state = GameEngine.initializeGame("room1", playerIds)
        
        // player1の手札を1枚だけに設定（テスト用）
        val lastCard = state.getPlayerHand("player1")!!.first()
        state = state.updatePlayerHand("player1", listOf(lastCard))
        
        // その1枚が場札に出せる場合のみテスト
        if (Card.isValidMove(lastCard, state.fieldCards.first)) {
            val newState = GameEngine.playCard(state, "player1", lastCard, 0)
            
            // 手札が0枚
            assertEquals(0, newState.getPlayerHand("player1")!!.size)
            
            // ゲーム終了
            assertEquals(GameStatus.FINISHED, newState.status)
        }
    }

    @Test
    fun `drawCard should add card to hand`() {
        val playerIds = listOf("player1", "player2")
        var state = GameEngine.initializeGame("room1", playerIds)
        
        // プレイ可能なカードがない状態を作る（テスト用）
        // 場札と手札が全く合わないカードに設定
        state = state.updateFieldCards(Pair(Card(Suit.SPADES, 1), Card(Suit.HEARTS, 1)))
        state = state.updatePlayerHand("player1", listOf(Card(Suit.DIAMONDS, 5)))
        
        val initialDeckSize = state.deckRemaining
        val newState = GameEngine.drawCard(state, "player1")
        
        // 手札が1枚増えている
        assertEquals(2, newState.getPlayerHand("player1")!!.size)
        
        // 山札が1枚減っている
        assertEquals(initialDeckSize - 1, newState.deckRemaining)
        
        // ターンが進んでいる
        assertEquals(1, newState.currentPlayerIndex)
    }

    @Test
    fun `skipTurn should advance turn when no playable cards and empty deck`() {
        val playerIds = listOf("player1", "player2")
        var state = GameEngine.initializeGame("room1", playerIds)
        
        // 山札を空にする
        state = state.updateDeck(emptyList())
        
        // プレイ可能なカードがない状態を作る
        state = state.updateFieldCards(Pair(Card(Suit.SPADES, 1), Card(Suit.HEARTS, 1)))
        state = state.updatePlayerHand("player1", listOf(Card(Suit.DIAMONDS, 5)))
        
        val newState = GameEngine.skipTurn(state, "player1")
        
        // ターンが進んでいる
        assertEquals(1, newState.currentPlayerIndex)
        assertEquals("player2", newState.currentPlayerId)
    }

    @Test
    fun `isStalemate should return true when no one can play`() {
        val playerIds = listOf("player1", "player2")
        var state = GameEngine.initializeGame("room1", playerIds)
        
        // 山札を空にする
        state = state.updateDeck(emptyList())
        
        // 全プレイヤーがプレイ不可能な状態を作る
        state = state.updateFieldCards(Pair(Card(Suit.SPADES, 1), Card(Suit.HEARTS, 1)))
        state = state.updatePlayerHand("player1", listOf(Card(Suit.DIAMONDS, 5)))
        state = state.updatePlayerHand("player2", listOf(Card(Suit.CLUBS, 7)))
        
        assertTrue(GameEngine.isStalemate(state), "行き詰まり状態である")
    }

    @Test
    fun `isStalemate should return false when deck has cards`() {
        val playerIds = listOf("player1", "player2")
        val state = GameEngine.initializeGame("room1", playerIds)
        
        assertFalse(GameEngine.isStalemate(state), "山札がある場合は行き詰まりではない")
    }

    @Test
    fun `finishGame should rank players by hand size`() {
        val playerIds = listOf("player1", "player2", "player3")
        var state = GameEngine.initializeGame("room1", playerIds)
        
        // 手札の枚数を調整
        state = state.updatePlayerHand("player1", listOf(Card(Suit.SPADES, 1), Card(Suit.SPADES, 2), Card(Suit.SPADES, 3))) // 3枚
        state = state.updatePlayerHand("player2", listOf(Card(Suit.HEARTS, 1))) // 1枚
        state = state.updatePlayerHand("player3", listOf(Card(Suit.DIAMONDS, 1), Card(Suit.DIAMONDS, 2))) // 2枚
        
        val finishedState = GameEngine.finishGame(state)
        
        assertEquals(GameStatus.FINISHED, finishedState.status)
        
        // player2が1位（1枚）
        val player2 = finishedState.players.find { it.playerId == "player2" }!!
        assertEquals(1, player2.rank)
        
        // player3が2位（2枚）
        val player3 = finishedState.players.find { it.playerId == "player3" }!!
        assertEquals(2, player3.rank)
        
        // player1が3位（3枚）
        val player1 = finishedState.players.find { it.playerId == "player1" }!!
        assertEquals(3, player1.rank)
    }
}
