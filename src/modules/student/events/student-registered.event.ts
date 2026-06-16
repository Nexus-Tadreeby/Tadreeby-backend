export class StudentRegisteredEvent {
    constructor(
        public readonly studentId: number,
        public readonly universityId: number,
        // public readonly verificationDocument: string,
    ) { }
}