export class StudentDocumentReuploadedEvent {
    constructor(public readonly studentId: number, public readonly universityId: number) { }
}
