'use strict';

const hslGraphQL = require('@aapokiiso/hsl-congestion-graphql-gateway');
const { db } = require('@aapokiiso/hsl-congestion-db-schema');
const NoSuchTripError = require('./src/no-such-trip-error');
const CouldNotSaveTripError = require('./src/could-not-save-trip-error');

module.exports = {
    /**
     * @param {string} tripId
     * @returns {Promise<object>}
     * @throws NoSuchTripError
     */
    async getById(tripId) {
        const trip = await db().models.Trip.findByPk(tripId);

        if (!trip) {
            throw new NoSuchTripError(
                `Could not find trip with ID '${tripId}'`
            );
        }

        return trip;
    },
    /**
     * @param {string} tripId
     * @returns {Promise<object>}
     * @throws CouldNotSaveTripError
     */
    async createById(tripId) {
        try {
            const tripData = await findDataFromApi(tripId);

            return await createTripToDb(tripId, tripData);
        } catch (e) {
            throw new CouldNotSaveTripError(
                `Could not save trip with ID '${tripId}'. Reason: ${e.message}`
            );
        }
    },
};

async function findDataFromApi(tripId) {
    const { trip } = await hslGraphQL.query(
        `{
            trip(id: "${tripId}") {
                pattern {
                    code
                }
            }
        }`,
        {
            priority: hslGraphQL.requestPriority.high,
        }
    );

    return trip;
}

async function createTripToDb(tripId, tripData) {
    const {
        pattern: routePatternData,
    } = tripData;

    const {
        code: routePatternId,
    } = routePatternData;

    const [trip] = await db().models.Trip.findOrCreate({
        where: {
            id: tripId,
            routePatternId,
        },
    });

    return trip;
}
