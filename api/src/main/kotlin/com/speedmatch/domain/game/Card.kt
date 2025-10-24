package com.speedmatch.domain.game

/**
 * トランプカード
 * 
 * @property suit スート（♠️, ♥️, ♦️, ♣️）
 * @property rank ランク（A=1, 2-10, J=11, Q=12, K=13）
 */
data class Card(
    val suit: Suit,
    val rank: Int
) {
    /**
     * カードID（例: "♠️A", "♥️7", "♣️K"）
     */
    val id: String
        get() = "${suit.symbol}${rankToString()}"

    /**
     * カードの色
     */
    val color: CardColor
        get() = when (suit) {
            Suit.SPADES, Suit.CLUBS -> CardColor.BLACK
            Suit.HEARTS, Suit.DIAMONDS -> CardColor.RED
        }

    /**
     * カードの数値（1-13）
     */
    val value: Int
        get() = rank

    private fun rankToString(): String = when (rank) {
        1 -> "A"
        11 -> "J"
        12 -> "Q"
        13 -> "K"
        else -> rank.toString()
    }

    companion object {
        /**
         * 52枚のトランプデッキを生成
         */
        fun createDeck(): List<Card> {
            return Suit.values().flatMap { suit ->
                (1..13).map { rank ->
                    Card(suit, rank)
                }
            }
        }

        /**
         * 2つのカードが互いにプレイ可能かチェック
         * （数字±1または同じスート）
         */
        fun isValidMove(playedCard: Card, fieldCard: Card): Boolean {
            // 同じスート
            if (playedCard.suit == fieldCard.suit) return true
            
            // 数字±1（Aと13もつながる）
            val rankDiff = Math.abs(playedCard.rank - fieldCard.rank)
            if (rankDiff == 1) return true
            
            // AとKのラップアラウンド
            if ((playedCard.rank == 1 && fieldCard.rank == 13) || 
                (playedCard.rank == 13 && fieldCard.rank == 1)) return true
            
            return false
        }
    }
}

/**
 * トランプのスート
 */
enum class Suit(val symbol: String, val displayName: String) {
    SPADES("♠️", "スペード"),
    HEARTS("♥️", "ハート"),
    DIAMONDS("♦️", "ダイヤ"),
    CLUBS("♣️", "クラブ")
}

/**
 * カードの色
 */
enum class CardColor {
    RED,
    BLACK
}
