import { Timestamp } from '@google-cloud/firestore'
import { isPerson } from './Person.guard'

const Bob = {
    name: "Bob",
    age: 9000,
    children: [],
    docData: Timestamp.now()
}

const Alice = {
    name: "Alice",
}

const people = [Bob, Alice];

people.forEach(p => {
    isPerson(p) ?
        console.log(p.name, "is a person!")
    :
        console.log(p.name, "is NOT a person")
})