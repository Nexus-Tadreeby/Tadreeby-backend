export class StudentRejectedEvent {
    constructor(
        public readonly userId: number,
        public readonly reason: string,
    ) { }
}