var gameList = [
	{
		name: 'Poker',
		playerNumber: [2,3,4],
		url: '/poker',
		filepath: './onlineTest.html',
		rulepage: '/pokerRule.html',
		settings: {
			RandomPlayerOrder: {type: "checkbox", text:"隨機玩家順序", default: true},
			drawCardFrom: {
				text: "抽牌方式:",
				poolDeck: {type: "checkbox", text: "牌庫頂", default: true},
				openPoolDeck: {type: "checkbox", text: "牌庫頂開三張牌", default: false},
				outDeck: {type: "checkbox", text: "出牌堆頂", default: false},
			},
		},
	},
];

module.exports = gameList;