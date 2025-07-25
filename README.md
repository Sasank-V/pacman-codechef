# PAC-MAN Game - Built with Phaser & Next.js

A classic PAC-MAN arcade game recreation built with Phaser 3 and Next.js, featuring advanced AI, retro styling, and modern web technologies.

## 🎮 Game Features

### Core Gameplay
- **Classic PAC-MAN mechanics**: Eat dots, avoid ghosts, collect power pellets
- **Advanced Ghost AI**: Sophisticated pathfinding using BFS algorithm with Manhattan distance heuristics
- **Grid-based movement**: Authentic arcade-style movement system
- **Warp tunnels**: Teleport through the sides of the maze
- **Power mode**: Eat ghosts when powered up
- **Progressive difficulty**: Multiple levels with increasing challenge

### AI & Technical Features
- **Smart Ghost Behavior**: Each ghost has unique targeting strategies
  - Red Ghost (Blinky): Direct chase behavior
  - Pink Ghost (Pinky): Ambush 4 tiles ahead of PAC-MAN
  - Blue Ghost (Inky): Complex positioning relative to PAC-MAN and Red Ghost
  - Orange Ghost (Clyde): Switches between chase and scatter based on distance
- **A* Pathfinding**: Ghosts use sophisticated algorithms to navigate the maze
- **Mode switching**: Ghosts alternate between chase, scatter, and frightened modes
- **Collision detection**: Precise physics for smooth gameplay

### User Experience
- **Retro aesthetic**: Authentic PAC-MAN styling with scanline effects and retro fonts
- **Sound system**: Complete audio experience with classic PAC-MAN sounds
- **Leaderboard**: Local storage-based scoring system with username input
- **Responsive design**: Works on desktop and mobile devices
- **Fullscreen support**: Immersive gaming experience

### Modern Features
- **Username input**: Save high scores with custom usernames
- **Navigation system**: Easy switching between game, leaderboard, and home
- **Input validation**: Robust username handling with trim and empty checks
- **Keyboard controls**: Arrow keys and WASD support
- **Game state management**: Proper pause, resume, and game over handling

## 🚀 Technology Stack

- **[Phaser 3.90.0](https://github.com/phaserjs/phaser)**: Game engine
- **[Next.js 15.3.1](https://github.com/vercel/next.js)**: React framework
- **[TypeScript 5](https://github.com/microsoft/TypeScript)**: Type safety
- **React 19**: UI components and state management
- **CSS Modules**: Styled components with retro theming

## 🎯 Controls

| Key | Action |
|-----|--------|
| `Arrow Keys` or `WASD` | Move PAC-MAN |
| `L` | Go to Leaderboard (from game over screen) |
| `R` | Restart Game (from game over screen) |
| `M` | Return to Main Menu (from game over screen) |
| `Enter` | Submit username (during score entry) |

## 🛠️ Installation & Setup

### Requirements
[Node.js](https://nodejs.org) is required to install dependencies and run the project.

### Available Commands

| Command | Description |
|---------|-------------|
| `npm install` | Install project dependencies |
| `npm run dev` | Launch development server at `http://localhost:3000` |
| `npm run build` | Create production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint code analysis |

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd pacman
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000` and start playing!

## 📁 Project Structure

```
src/
├── pages/
│   ├── _app.tsx          # Next.js app component
│   ├── _document.tsx     # HTML document structure
│   ├── index.tsx         # Home page with retro PAC-MAN theme
│   ├── game.tsx          # Game page component
│   └── leaderboard.tsx   # Leaderboard display
├── game/
│   ├── main.ts           # Phaser game configuration
│   ├── EventBus.ts       # React-Phaser communication
│   └── scenes/
│       ├── Boot.ts       # Initial loading scene
│       ├── Preloader.ts  # Asset loading with progress bar
│       ├── MainMenu.ts   # Main menu scene
│       ├── Game.ts       # Core game logic and AI
│       └── GameOver.ts   # Game over handling
├── styles/
│   ├── globals.css       # Global styles
│   └── Home.module.css   # Component-specific retro styling
├── App.tsx               # Main app wrapper
└── PhaserGame.tsx        # Phaser-React bridge component

public/
├── assets/
│   ├── pacman/          # PAC-MAN sprite assets
│   │   ├── pac_man_*.png
│   │   ├── ghost_*.png
│   │   ├── pill.png
│   │   └── power_pill.png
│   └── sounds/          # Audio files
│       ├── eat_dot_*.wav
│       ├── siren*.wav
│       └── death_*.wav
└── favicon.png
```

## 🎨 Game Architecture

### AI System
The ghost AI uses a sophisticated decision-making system:

1. **Pathfinding Algorithm**: BFS with Manhattan distance heuristics
2. **Behavioral States**: Chase, Scatter, Frightened modes
3. **Individual Personalities**: Each ghost has unique targeting logic
4. **Grid-based Movement**: Authentic arcade-style positioning
5. **Mode Switching**: Dynamic behavior changes based on game state

### React-Phaser Integration
- **EventBus**: Bidirectional communication between React and Phaser
- **State Management**: React handles UI state, Phaser manages game state
- **Navigation**: Custom events for seamless page transitions
- **Data Persistence**: LocalStorage for leaderboard and settings

### Styling System
- **Retro Theme**: Authentic PAC-MAN color scheme and typography
- **Responsive Design**: Adapts to different screen sizes
- **CSS Modules**: Scoped styling with dynamic class names
- **Animation Effects**: Scanlines, glowing text, and sprite animations

## 🏆 Game Mechanics

### Scoring System
- **Dots**: 10 points each
- **Power Pellets**: 50 points each
- **Ghosts**: 200, 400, 800, 1600 points (exponential)
- **Bonus Items**: Varies by level

### Ghost Behavior
- **Chase Mode**: Ghosts actively hunt PAC-MAN
- **Scatter Mode**: Ghosts retreat to corners
- **Frightened Mode**: Ghosts become vulnerable after power pellet
- **Speed Variations**: Different speeds for different modes

### Level Progression
- **Increasing Difficulty**: Faster ghosts, shorter power mode
- **Maze Persistence**: Same layout with escalating challenge
- **Sound Evolution**: Different siren sounds for different levels

## 🚀 Deployment

### Production Build
```bash
npm run build
```

The build creates optimized files in the `.next` folder. Deploy the entire project directory to any hosting service that supports Next.js.

### Hosting Recommendations
- **Vercel**: Optimal for Next.js projects
- **Netlify**: Great for static deployments
- **Railway**: Simple full-stack hosting
- **Heroku**: Traditional platform-as-a-service

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🎮 Credits

### Development
- Game Engine: [Phaser 3](https://phaser.io)
- Framework: [Next.js](https://nextjs.org)
- Original Game: Inspired by the classic PAC-MAN arcade game

### Assets
- Sprites: Custom pixel art based on original PAC-MAN
- Sounds: Classic arcade audio effects
- Fonts: Retro monospace typography

### Special Thanks
- Phaser community for excellent documentation
- Classic arcade game developers for inspiration
- Open source contributors and maintainers

---

**Play the classic that started it all! 🟡👻**

*Created with ❤️ for retro gaming enthusiasts*
