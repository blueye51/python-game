export const PATH = {
  menu: '/',
  game: '/game',
} as const

export const paths = () => ({
  menu: PATH.menu,
  game: PATH.game,
})
