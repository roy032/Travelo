import { describe, it, expect, vi, beforeEach } from 'vitest';

const DAY = 24 * 60 * 60 * 1000;

const chain = { select: vi.fn(), sort: vi.fn(), limit: vi.fn(), lean: vi.fn() };
chain.select.mockReturnValue(chain);
chain.sort.mockReturnValue(chain);
chain.limit.mockReturnValue(chain);

vi.mock('#models/trip.model.js', () => ({ default: { find: vi.fn(() => chain) } }));
vi.mock('#models/notification.model.js', () => ({ default: {} }));
vi.mock('#models/activity.model.js', () => ({
  default: { aggregate: vi.fn() },
}));
vi.mock('#models/checklist.model.js', () => ({
  default: { aggregate: vi.fn() },
}));

const { default: Trip } = await import('#models/trip.model.js');
const { default: Activity } = await import('#models/activity.model.js');
const { default: ChecklistItem } = await import('#models/checklist.model.js');
const { getPublicUpcomingTrips } = await import('#services/trip.service.js');

const trip = (id, startOffsetDays, lengthDays) => {
  const startDate = new Date(Date.now() + startOffsetDays * DAY);
  return {
    _id: { toString: () => id },
    title: `Trip ${id}`,
    description: '',
    startDate,
    endDate: new Date(startDate.getTime() + lengthDays * DAY),
    destinationType: 'beach',
    tripCategory: 'domestic',
    owner: { toString: () => 'owner' },
    members: [{ toString: () => 'owner' }],
    createdAt: new Date(),
  };
};

describe('getPublicUpcomingTrips', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    chain.lean.mockResolvedValue([]);
    Activity.aggregate.mockResolvedValue([]);
    ChecklistItem.aggregate.mockResolvedValue([]);
  });

  it('only returns upcoming, non-deleted trips by default', async () => {
    await getPublicUpcomingTrips();
    const query = Trip.find.mock.calls[0][0];
    expect(query.isDeleted).toBe(false);
    expect(query.startDate.$gte).toBeInstanceOf(Date);
    expect(chain.sort).toHaveBeenCalledWith({ startDate: 1 });
  });

  it('applies type, category, text and date filters', async () => {
    const from = new Date(Date.now() + 10 * DAY);
    const to = new Date(Date.now() + 20 * DAY);
    await getPublicUpcomingTrips({
      search: 'a.b',
      destinationType: 'mountain',
      tripCategory: 'international',
      from,
      to,
    });
    const query = Trip.find.mock.calls[0][0];
    expect(query.destinationType).toBe('mountain');
    expect(query.tripCategory).toBe('international');
    expect(query.startDate.$gte).toEqual(from);
    // The whole "to" day is included
    expect(query.startDate.$lt).toEqual(new Date(to.getTime() + DAY));
    // Search text is escaped, not treated as a regex
    expect(query.$or[0].title.$regex).toBe('a\\.b');
  });

  it('never returns trips that already started, even with an old "from" date', async () => {
    const before = Date.now();
    await getPublicUpcomingTrips({ from: new Date('2000-01-01') });
    const query = Trip.find.mock.calls[0][0];
    expect(query.startDate.$gte.getTime()).toBeGreaterThanOrEqual(before);
  });

  it('filters by trip length in whole days', async () => {
    await getPublicUpcomingTrips({ minDays: 3, maxDays: 7 });
    const [minCheck, maxCheck] = Trip.find.mock.calls[0][0].$expr.$and;
    expect(minCheck.$gt[1]).toBe(2 * DAY);
    expect(maxCheck.$lte[1]).toBe(7 * DAY);
  });

  it('sorts by length and returns true activity and checklist counts', async () => {
    chain.lean.mockResolvedValue([trip('a', 5, 10), trip('b', 3, 2), trip('c', 1, 6)]);
    Activity.aggregate.mockResolvedValue([{ _id: 'a', count: 14 }]);
    ChecklistItem.aggregate.mockResolvedValue([{ _id: 'b', count: 25 }]);

    const trips = await getPublicUpcomingTrips({ sort: 'shortest' });

    expect(trips.map((t) => t.id)).toEqual(['b', 'c', 'a']);
    expect(trips.map((t) => t.durationDays)).toEqual([2, 6, 10]);
    expect(trips.find((t) => t.id === 'a').activityCount).toBe(14);
    expect(trips.find((t) => t.id === 'b').checklistCount).toBe(25);
    // Public results do not expose activity or checklist contents
    expect(trips[0]).not.toHaveProperty('checklist');
  });
});
