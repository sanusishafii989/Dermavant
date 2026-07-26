import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

interface DoctorCardProps {
  doctor: {
    id: string;
    doctorId: string;
    specialization: string;
    consultation_fee: number;
    rating: number;
    hospital: string;
    experience: number;
    bio: string;
    available_today: boolean;
    user: {
      fullName: string;
      email: string;
      imageUrl?: string;
    } | null;
  };
  selected?: boolean;
  onSelect: (doctorId: string) => void;
}

export function DoctorCard({ doctor, selected = false, onSelect }: DoctorCardProps) {
  return (
    <Card className={`h-full border ${selected ? "border-cyan/50 bg-cyan/10" : "border-white/10 bg-white/5"}`}>
      <div className="flex h-full flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-cyan">{doctor.specialization}</p>
            <h3 className="mt-1 text-lg font-semibold text-white">{doctor.user?.fullName || "Doctor"}</h3>
          </div>
          <Badge variant={doctor.available_today ? "cyan" : "gold"}>
            {doctor.available_today ? "Available today" : "Pending availability"}
          </Badge>
        </div>

        <div className="space-y-2 text-sm text-white/70">
          <p>Hospital: {doctor.hospital}</p>
          <p>Experience: {doctor.experience} years</p>
          <p>Fee: {doctor.consultation_fee.toLocaleString()} NGN</p>
          <p>Rating: {doctor.rating.toFixed(1)} / 5</p>
          <p>{doctor.bio}</p>
        </div>

        <div className="mt-auto">
          <Button
            variant={selected ? "gold" : "primary"}
            size="md"
            className="w-full"
            onClick={() => onSelect(doctor.id)}
          >
            {selected ? "Selected" : "Choose doctor"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
