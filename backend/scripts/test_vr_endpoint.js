/**
 * Test del endpoint POST /api/v1/session-results
 */
const testPayload = {
    schemaVersion: "1.0",
    participantId: "TEST_001",
    activityId: "tinto_easy_01",
    startedAtIso: "2026-01-21T05:13:26.428Z",
    endedAtIso: "2026-01-21T05:19:21.598Z",
    totalSeconds: 355.17,
    summary: {
        totalErrors: 3,
        totalDrops: 2,
        totalReleases: 5,
        setsCompleted: 4
    },
    sets: [
        {
            setName: "Ingredients",
            startedAtIso: "2026-01-21T05:13:26.531Z",
            endedAtIso: "2026-01-21T05:14:06.716Z",
            durationSeconds: 40.18,
            blockedCount: 1,
            dropsCount: 0,
            releasesCount: 1,
            errors: [{
                code: "STOVE_ON_NO_POT",
                message: "Intento encender estufa sin olla",
                timestampIso: "2026-01-21T05:13:40.112Z"
            }]
        },
        {
            setName: "Preparation",
            startedAtIso: "2026-01-21T05:15:10.526Z",
            endedAtIso: "2026-01-21T05:18:31.921Z",
            durationSeconds: 201.39,
            blockedCount: 2,
            dropsCount: 1,
            releasesCount: 2,
            completion: {
                coffeeAdded: true,
                sugarAdded: true,
                cupCoffeeAmount01: 1.0
            },
            errors: [{
                code: "COFFEE_BEFORE_BOIL",
                message: "Intento agregar cafe antes de hervir",
                timestampIso: "2026-01-21T05:16:02.440Z"
            }]
        },
        {
            setName: "Organization",
            startedAtIso: "2026-01-21T05:18:31.921Z",
            endedAtIso: "2026-01-21T05:19:21.598Z",
            durationSeconds: 49.67,
            blockedCount: 0,
            dropsCount: 0,
            releasesCount: 0,
            errors: [],
            returnedObjects: ["Cafe_Sello_Rojo", "Azucar_Manuelita", "Botella_Agua"]
        }
    ]
};

async function testEndpoint() {
    try {
        const response = await fetch('http://localhost:3001/api/v1/session-results', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testPayload)
        });

        const data = await response.json();
        console.log('Status:', response.status);
        console.log('Response:', JSON.stringify(data, null, 2));

        if (response.status === 201) {
            console.log('\n✅ PRUEBA EXITOSA - Sesion creada con ID:', data.id);
        } else {
            console.log('\n❌ PRUEBA FALLIDA');
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
}

testEndpoint();
