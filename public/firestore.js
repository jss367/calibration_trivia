export function submitAnswerToFirestore(sessionId, userId, answer, confidence) {
    if (!sessionId || !userId) {
        console.error('Session ID or User ID is missing.');
        return;
    }

    const answerData = { answer, confidence, timestamp: firebase.firestore.FieldValue.serverTimestamp() };
    firebase.firestore().collection('sessions').doc(sessionId).collection('answers').doc(userId).set(answerData)
        .then(() => console.log('Answer submitted successfully'))
        .catch(error => console.error("Error submitting answer:", error));
}
