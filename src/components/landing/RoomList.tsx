import type { RoomWithRelations } from "./RoomCard";
import { RoomCard } from "./RoomCard";

export function RoomList({ rooms }: { rooms: RoomWithRelations[] }) {
  if (rooms.length === 0) return null;

  return (
    <section id="rooms" className="bg-surface py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-primary-700">
          Rooms &amp; Suites
        </p>
        <h2 className="mt-3 text-center font-display text-3xl font-semibold text-ink sm:text-4xl">
          Find Your Perfect Stay
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-center text-base text-muted">
          Pilih kamar yang paling sesuai dengan kebutuhanmu — semua dilengkapi fasilitas terbaik.
        </p>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <RoomCard key={room.id} room={room} />
          ))}
        </div>
      </div>
    </section>
  );
}
