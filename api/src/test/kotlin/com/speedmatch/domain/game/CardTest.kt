package com.speedmatch.domain.game

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class CardTest {
    @Test
    fun `createDeck should generate 52 cards`() {
        val deck = Card.createDeck()
        assertEquals(52, deck.size, "デッキは52枚である必要があります")
    }

    @Test
    fun `createDeck should contain all suits and ranks`() {
        val deck = Card.createDeck()
        
        // 各スートが13枚ずつあることを確認
        assertEquals(13, deck.count { it.suit == Suit.SPADES })
        assertEquals(13, deck.count { it.suit == Suit.HEARTS })
        assertEquals(13, deck.count { it.suit == Suit.DIAMONDS })
        assertEquals(13, deck.count { it.suit == Suit.CLUBS })
        
        // 各ランクが4枚ずつあることを確認
        for (rank in 1..13) {
            assertEquals(4, deck.count { it.rank == rank }, "ランク${rank}は4枚ある必要があります")
        }
    }

    @Test
    fun `card color should be correct`() {
        val spadesCard = Card(Suit.SPADES, 1)
        val heartsCard = Card(Suit.HEARTS, 1)
        val diamondsCard = Card(Suit.DIAMONDS, 1)
        val clubsCard = Card(Suit.CLUBS, 1)
        
        assertEquals(CardColor.BLACK, spadesCard.color)
        assertEquals(CardColor.RED, heartsCard.color)
        assertEquals(CardColor.RED, diamondsCard.color)
        assertEquals(CardColor.BLACK, clubsCard.color)
    }

    @Test
    fun `card id should be formatted correctly`() {
        val aceOfSpades = Card(Suit.SPADES, 1)
        val kingOfHearts = Card(Suit.HEARTS, 13)
        val tenOfDiamonds = Card(Suit.DIAMONDS, 10)
        
        assertEquals("♠️A", aceOfSpades.id)
        assertEquals("♥️K", kingOfHearts.id)
        assertEquals("♦️10", tenOfDiamonds.id)
    }

    @Test
    fun `isValidMove should return true for same suit`() {
        val card1 = Card(Suit.SPADES, 5)
        val card2 = Card(Suit.SPADES, 10)
        
        assertTrue(Card.isValidMove(card1, card2), "同じスートは有効な手")
    }

    @Test
    fun `isValidMove should return true for rank plus 1`() {
        val card1 = Card(Suit.SPADES, 6)
        val card2 = Card(Suit.HEARTS, 5)
        
        assertTrue(Card.isValidMove(card1, card2), "ランク+1は有効な手")
    }

    @Test
    fun `isValidMove should return true for rank minus 1`() {
        val card1 = Card(Suit.SPADES, 4)
        val card2 = Card(Suit.HEARTS, 5)
        
        assertTrue(Card.isValidMove(card1, card2), "ランク-1は有効な手")
    }

    @Test
    fun `isValidMove should return true for Ace to King wraparound`() {
        val ace = Card(Suit.SPADES, 1)
        val king = Card(Suit.HEARTS, 13)
        
        assertTrue(Card.isValidMove(ace, king), "A→Kは有効な手")
        assertTrue(Card.isValidMove(king, ace), "K→Aは有効な手")
    }

    @Test
    fun `isValidMove should return false for invalid rank difference`() {
        val card1 = Card(Suit.SPADES, 5)
        val card2 = Card(Suit.HEARTS, 8) // 差が3
        
        assertFalse(Card.isValidMove(card1, card2), "ランク差が2以上は無効な手")
    }

    @Test
    fun `isValidMove should return false for different suit and invalid rank`() {
        val card1 = Card(Suit.SPADES, 5)
        val card2 = Card(Suit.HEARTS, 10)
        
        assertFalse(Card.isValidMove(card1, card2), "異なるスートかつランク差が2以上は無効")
    }
}
