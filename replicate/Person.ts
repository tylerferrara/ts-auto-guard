import { Timestamp } from '@google-cloud/firestore';

export interface Person {
    name: string
    age?: number
    children: Person[]
    time: Timestamp
}