/**
 * UIManager.js — Menu UI, modals, HUD, and screen management
 * 
 * Handles all DOM-based UI: main menu, modals (leaderboard, character,
 * shop, rewards, missions, settings), HUD updates, game-over screen,
 * and pause screen. No gameplay logic — pure presentation.
 */

import SaveManager from './SaveManager.js';

export default class MenuUI {
    constructor(game) {
        this.game = game;

        // Character & board data
        this.characters = [
            { id: 'runner', icon: '🏃', name: 'Default Runner', unlocked: true },
            { id: 'skater', icon: '🛹', name: 'Skater Boy', unlocked: true },
            { id: 'ninja', icon: '🥷', name: 'Shadow Ninja', unlocked: false },
            { id: 'astro', icon: '🧑‍🚀', name: 'Astronaut', unlocked: false },
            { id: 'robot', icon: '🤖', name: 'Robo Runner', unlocked: false },
            { id: 'wizard', icon: '🧙', name: 'Wizard', unlocked: false },
            { id: 'pirate', icon: '🏴‍☠️', name: 'Pirate', unlocked: false },
            { id: 'alien', icon: '👽', name: 'Alien', unlocked: false }
        ];
        this.boards = [
            { id: 'classic', icon: '🛹', name: 'Classic', unlocked: true },
            { id: 'flame', icon: '🔥', name: 'Flame Board', unlocked: true },
            { id: 'ice', icon: '❄️', name: 'Ice Board', unlocked: false },
            { id: 'neon', icon: '💜', name: 'Neon Board', unlocked: false }
        ];
        this.shopItems = [
            { id: 'board', icon: '🛹', name: 'Hoverboard', desc: 'Protects from one crash.', cost: 100, key: 'board' },
            { id: 'magnet', icon: '🧲', name: 'Coin Magnet', desc: 'Attract coins for 10s!', cost: 50, key: 'magnet' },
            { id: 'x2', icon: '✖️2️⃣', name: 'Score Boost', desc: 'Double score for 30s.', cost: 150, key: 'x2' },
            { id: 'jetpack', icon: '🚀', name: 'Jetpack', desc: 'Fly over obstacles!', cost: 200, key: 'jetpack' }
        ];
        this.missions = [
            { id: 'm1', title: 'Coin Collector', desc: 'Collect 50 coins in one run', target: 50, key: 'missionCoins', reward: 100, icon: '🪙' },
            { id: 'm2', title: 'Distance Runner', desc: 'Run 500 meters', target: 500, key: 'missionDist', reward: 150, icon: '📏' },
            { id: 'm3', title: 'High Scorer', desc: 'Score 1000 points', target: 1000, key: 'missionScore', reward: 200, icon: '⭐' }
        ];

        this.selectedChar = SaveManager.loadCharacter();
        this.selectedBoard = SaveManager.loadBoard();

        this.lbNames = ['ShadowX', 'NitroKid', 'SpeedQueen', 'BlazeMaster', 'RunnerJay',
            'TurboMax', 'FlashDash', 'CosmicRun', 'PixelPunk', 'NeonWolf'];

        this.setupEventListeners();
        this.populateAll();
    }

    // ===== Event Listeners =====

    setupEventListeners() {
        const $ = id => document.getElementById(id);

        // Core game buttons
        $('play-button').addEventListener('click', () => this.game.startGame());
        $('pause-button').addEventListener('click', () => this.game.togglePause());
        $('play-again-button').addEventListener('click', () => this.game.startGame());
        $('menu-button').addEventListener('click', () => this.game.showMainMenu());

        // Bottom nav
        $('nav-leaderboard').addEventListener('click', () => this.openModal('modal-leaderboard'));
        $('nav-character').addEventListener('click', () => this.openModal('modal-character'));
        $('nav-shop').addEventListener('click', () => { this.renderShop(); this.openModal('modal-shop'); });

        // Action buttons
        $('btn-missions').addEventListener('click', () => { this.renderMissions(); this.openModal('modal-missions'); });
        $('btn-daily').addEventListener('click', () => { this.renderMissions(); this.openModal('modal-missions'); });
        $('btn-rewards').addEventListener('click', () => { this.renderRewards(); this.openModal('modal-rewards'); });
        $('btn-settings').addEventListener('click', () => this.openModal('modal-settings'));
        $('btn-notif').addEventListener('click', () => { this.renderRewards(); this.openModal('modal-rewards'); });

        // Close buttons
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => this.closeModal(btn.dataset.close));
        });

        // Close on overlay click
        document.querySelectorAll('.modal-overlay').forEach(ov => {
            ov.addEventListener('click', e => { if (e.target === ov) this.closeModal(ov.id); });
        });

        // Leaderboard tabs
        document.querySelectorAll('.lb-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.lb-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.renderLeaderboard();
            });
        });

        // Shop tabs
        document.querySelectorAll('.shop-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.shop-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.renderShop();
            });
        });

        // Settings toggles
        document.querySelectorAll('.toggle').forEach(tog => {
            tog.addEventListener('click', () => tog.classList.toggle('on'));
        });

        // Free mystery box
        $('free-box').addEventListener('click', () => {
            const bonus = [10, 25, 50, 100][Math.floor(Math.random() * 4)];
            this.game.gameState.totalCoins += bonus;
            this.game.gameState.saveTotalCoins();
            this.updateCurrencyDisplay();
            $('free-box').querySelector('.box-text').textContent = `+${bonus} coins!`;
            setTimeout(() => { $('free-box').querySelector('.box-text').textContent = 'Free Mystery Box'; }, 2000);
        });
    }

    // ===== Modal Helpers =====

    openModal(id) { document.getElementById(id).classList.add('open'); }
    closeModal(id) { document.getElementById(id).classList.remove('open'); }

    // ===== Populate All Content =====

    populateAll() {
        this.renderLeaderboard();
        this.renderCharacters();
        this.renderShop();
        this.renderRewards();
        this.renderMissions();
    }

    updateCurrencyDisplay() {
        const gs = this.game.gameState;
        document.getElementById('cur-coins').textContent = gs.totalCoins.toLocaleString();
        document.getElementById('shop-coin-count').textContent = gs.totalCoins.toLocaleString();
    }

    // ===== Leaderboard =====

    renderLeaderboard() {
        const list = document.getElementById('lb-list');
        const hs = this.game.gameState.highScore;
        let entries = this.lbNames.map((n, i) => ({
            name: n,
            score: Math.max(100, Math.floor(Math.random() * 5000 + 500)),
            avatar: ['😎', '🤠', '👩‍🎤', '🧑‍💻', '👨‍🚀', '🦸', '🧝', '🧑‍🎨', '👻', '🤖'][i]
        }));
        entries.push({ name: 'You', score: hs, avatar: '🏃', me: true });
        entries.sort((a, b) => b.score - a.score);
        list.innerHTML = entries.map((e, i) => {
            const rc = i === 0 ? '' : i === 1 ? ' silver' : i === 2 ? ' bronze' : ' normal';
            return `<div class="lb-entry${e.me ? ' me' : ''}"><div class="lb-rank${rc}">${i + 1}</div><div class="lb-avatar">${e.avatar}</div><div class="lb-info"><div class="lb-name">${e.name}</div><div class="lb-score">${e.me ? 'Your best' : 'Weekly'}</div></div><div class="lb-pts">${e.score.toLocaleString()}</div></div>`;
        }).join('');
    }

    // ===== Characters =====

    renderCharacters() {
        const cg = document.getElementById('char-grid');
        cg.innerHTML = this.characters.map(c =>
            `<div class="char-card${c.id === this.selectedChar ? ' selected' : ''}${!c.unlocked ? ' locked' : ''}" data-char="${c.id}">${c.icon}<div class="card-label">${c.name}</div>${!c.unlocked ? '<div class="card-lock">🔒</div>' : ''}</div>`
        ).join('');

        cg.querySelectorAll('.char-card').forEach(card => {
            card.addEventListener('click', () => {
                const ch = this.characters.find(c => c.id === card.dataset.char);
                if (!ch || !ch.unlocked) return;
                this.selectedChar = ch.id;
                SaveManager.saveCharacter(ch.id);
                document.getElementById('char-preview-icon').textContent = ch.icon;
                document.getElementById('char-preview-name').textContent = ch.name;
                cg.querySelectorAll('.char-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
            });
        });

        const bg = document.getElementById('board-grid');
        bg.innerHTML = this.boards.map(b =>
            `<div class="char-card${b.id === this.selectedBoard ? ' selected' : ''}${!b.unlocked ? ' locked' : ''}" data-board="${b.id}">${b.icon}<div class="card-label">${b.name}</div>${!b.unlocked ? '<div class="card-lock">🔒</div>' : ''}</div>`
        ).join('');

        bg.querySelectorAll('.char-card').forEach(card => {
            card.addEventListener('click', () => {
                const bd = this.boards.find(b => b.id === card.dataset.board);
                if (!bd || !bd.unlocked) return;
                this.selectedBoard = bd.id;
                SaveManager.saveBoard(bd.id);
                bg.querySelectorAll('.char-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
            });
        });
    }

    // ===== Shop =====

    renderShop() {
        const gs = this.game.gameState;
        const activeTab = document.querySelector('.shop-tab.active')?.dataset.shop || 'powerups';
        const container = document.getElementById('shop-items');
        this.updateCurrencyDisplay();

        if (activeTab === 'mystery') {
            container.innerHTML = `<div class="mystery-box" id="shop-mystery"><div class="box-icon">🎁</div><div class="box-text">Mystery Box</div><div class="box-sub">50 coins — random power-up!</div></div>`;
            document.getElementById('shop-mystery').addEventListener('click', () => {
                if (gs.totalCoins >= 50) {
                    gs.totalCoins -= 50;
                    const items = ['board', 'magnet'];
                    const item = items[Math.floor(Math.random() * items.length)];
                    gs.inventory[item] = (gs.inventory[item] || 0) + 1;
                    gs.saveTotalCoins(); gs.saveInventory();
                    this.renderShop();
                    document.getElementById('shop-mystery').querySelector('.box-text').textContent = `Won: ${item}!`;
                }
            });
            return;
        }

        container.innerHTML = this.shopItems.map(item => {
            const owned = gs.inventory[item.key] || 0;
            return `<div class="shop-item" id="shop-${item.id}"><div class="shop-item-icon">${item.icon}</div><div class="shop-item-info"><div class="shop-item-name">${item.name}</div><div class="shop-item-desc">${item.desc}</div><div class="shop-item-owned">Owned: ${owned}</div></div><button class="buy-btn ui-element" data-buy="${item.key}" data-cost="${item.cost}" ${gs.totalCoins < item.cost ? 'disabled' : ''}><span class="coin-icon"></span>${item.cost}</button></div>`;
        }).join('');

        container.querySelectorAll('.buy-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const ok = gs.buyItem(btn.dataset.buy, parseInt(btn.dataset.cost));
                if (ok) {
                    this.renderShop();
                    const el = btn.closest('.shop-item');
                    el.classList.remove('purchase-flash'); void el.offsetWidth; el.classList.add('purchase-flash');
                }
            });
        });
    }

    // ===== Rewards =====

    renderRewards() {
        const grid = document.getElementById('reward-grid');
        const streak = SaveManager.loadRewardStreak();
        const lastClaim = SaveManager.loadLastClaim();
        const today = new Date().toDateString();
        const claimed = lastClaim === today;
        const icons = ['🪙', '🔑', '🪙', '⭐', '🛹', '🪙', '🎁'];

        grid.innerHTML = Array.from({ length: 7 }, (_, i) => {
            let cls = i < streak ? 'claimed' : i === streak && !claimed ? 'today' : 'locked';
            return `<div class="reward-day ${cls}" data-day="${i}"><div class="rw-icon">${icons[i]}</div><div>Day ${i + 1}</div></div>`;
        }).join('');

        grid.querySelectorAll('.reward-day.today').forEach(el => {
            el.addEventListener('click', () => {
                const rewards = [25, 1, 50, 5, 1, 100, 1];
                const r = rewards[streak % 7];
                this.game.gameState.totalCoins += r;
                this.game.gameState.saveTotalCoins();
                SaveManager.saveRewardStreak((streak + 1) % 7);
                SaveManager.saveLastClaim(today);
                this.updateCurrencyDisplay();
                this.renderRewards();
            });
        });
    }

    // ===== Missions =====

    renderMissions() {
        const list = document.getElementById('mission-list');
        list.innerHTML = this.missions.map(m => {
            const progress = SaveManager.loadMissionProgress(m.key);
            const pct = Math.min(100, Math.floor(progress / m.target * 100));
            const done = progress >= m.target;
            return `<div class="mission-card"><div class="mission-top"><div class="mission-title">${m.icon} ${m.title}</div><div class="mission-reward">🪙 ${m.reward}</div></div><div class="mission-desc">${m.desc}</div><div class="progress-bar"><div class="progress-fill${done ? ' gold' : ''}" style="width:${pct}%"></div></div><div class="mission-progress-text">${done ? '✅ Complete!' : `${progress}/${m.target}`}</div></div>`;
        }).join('');
    }

    // ===== Screen Management =====

    showMainMenu() {
        document.getElementById('main-menu').classList.remove('hidden');
        document.getElementById('hud').classList.add('hidden');
        document.getElementById('game-over-screen').style.display = 'none';
        document.getElementById('pause-screen').style.display = 'none';
        document.getElementById('touch-instructions').classList.add('hidden');
        document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('open'));
        document.getElementById('menu-high-score').textContent = this.game.gameState.highScore.toLocaleString();
        this.updateCurrencyDisplay();
    }

    showGame() {
        document.getElementById('main-menu').classList.add('hidden');
        document.getElementById('hud').classList.remove('hidden');
        document.getElementById('game-over-screen').style.display = 'none';
        document.getElementById('pause-screen').style.display = 'none';
        document.getElementById('touch-instructions').classList.remove('hidden');
        document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('open'));
    }

    showPause() { document.getElementById('pause-screen').style.display = 'flex'; }
    hidePause() { document.getElementById('pause-screen').style.display = 'none'; }

    showGameOver(isNewRecord) {
        const screen = document.getElementById('game-over-screen');
        screen.style.display = 'flex';
        document.getElementById('final-score').textContent = this.game.gameState.score.toLocaleString();
        document.getElementById('final-coins').textContent = this.game.gameState.coins.toLocaleString();
        document.getElementById('final-distance').textContent = Math.floor(this.game.gameState.distance / 10) + 'm';
        const hse = document.getElementById('game-over-high-score');
        hse.textContent = this.game.gameState.highScore.toLocaleString();
        if (isNewRecord) hse.classList.add('new-record'); else hse.classList.remove('new-record');

        // Update mission progress
        const gs = this.game.gameState;
        SaveManager.saveMissionProgress('missionCoins', gs.coins);
        SaveManager.saveMissionProgress('missionDist', Math.floor(gs.distance / 10));
        SaveManager.saveMissionProgress('missionScore', gs.score);
    }

    updateHUD() {
        document.getElementById('score-display').textContent = this.game.gameState.score.toLocaleString();
        document.getElementById('coin-count').textContent = this.game.gameState.coins.toLocaleString();
        document.getElementById('distance-counter').textContent = Math.floor(this.game.gameState.distance / 10) + 'm';
    }
}
