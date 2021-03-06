import R from 'rxjs'
import RO from 'rxjs/operators'
import config from './config.mjs'

const batch$ = new R.Subject()

const induce = function (ev) {
    batch$.next(ev)
}

const counters = {
    todo: 0
}

function getId (type) {
    return counters[type]++
}

function todo () {
    return {
        id: getId('todo'),
        text: 'Lorem ipsum'
    }
}

function todoList (deferred) {
    const ping$ = new R.Observable(listener => {
        setTimeout(() => {
            ;[...Array(config.iterations).keys()].forEach(i => listener.next(i))
        }, 0)
    })

    const todo$ = RO.share()(RO.map(todo)(ping$))

    const old$ = RO.startWith({})(RO.filter(todo => todo.id % 4 === 0)(todo$))

    const sample$ = RO.map(([last, old]) => ({
        ...last,
        old
    }))(RO.withLatestFrom(old$)(todo$))

    const list$ = RO.scan((list, item) => [...list, item], [])(sample$)

    const end$ = RO.take(1)(
        RO.filter(list => list.length === config.iterations)(list$)
    )

    return RO.tap(res => deferred.resolve(res))(end$)
}

const lists$ = RO.mergeAll()(RO.map(todoList)(batch$))

lists$.subscribe(() => {})

export { induce }
