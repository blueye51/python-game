import { generatePath } from 'react-router-dom'

export const PATH = {
    menu: '/',
    game: '/game/:id',
} as const

export const paths = {
    menu: PATH.menu,
    game: (id: string) => generatePath(PATH.game, { id }),
}
