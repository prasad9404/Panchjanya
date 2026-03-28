import { Search } from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";

interface SearchBarProps {
  districts?: string[];
  talukas?: string[];
  onDistrictChange?: (value: string) => void;
  onTalukaChange?: (value: string) => void;
  onSearch?: (value: string) => void;
  className?: string;
}

export const SearchBar = ({
  districts = [],
  talukas = [],
  onDistrictChange,
  onTalukaChange,
  onSearch,
  className
}: SearchBarProps) => {
  return (
    <div className={`flex flex-col lg:flex-row items-stretch lg:items-center gap-2 p-1.5 lg:p-2 bg-white/90 backdrop-blur-xl rounded-xl lg:rounded-full shadow-lg border border-white/20 ${className || ''}`}>
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 lg:w-4 lg:h-4 text-primary" />
        <Input
          placeholder="Search sthans..."
          className="pl-9 lg:pl-11 h-9 lg:h-10 text-sm lg:text-base border-none bg-transparent focus-visible:ring-0 placeholder:text-muted-foreground/60 font-medium"
          onChange={(e) => onSearch?.(e.target.value)}
        />
      </div>

      <div className="flex gap-1.5 lg:gap-2 px-0.5 lg:px-1">
        <Select onValueChange={onDistrictChange}>
          <SelectTrigger className="w-1/2 lg:w-40 h-9 lg:h-10 text-xs lg:text-sm bg-muted/50 border-none rounded-lg lg:rounded-full focus:ring-0">
            <SelectValue placeholder="District" />
          </SelectTrigger>
          <SelectContent className="rounded-2xl border-border/50">
            <SelectItem value="all">All Districts</SelectItem>
            {districts.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select onValueChange={onTalukaChange}>
          <SelectTrigger className="w-1/2 lg:w-40 h-9 lg:h-10 text-xs lg:text-sm bg-muted/50 border-none rounded-lg lg:rounded-full focus:ring-0">
            <SelectValue placeholder="Taluka" />
          </SelectTrigger>
          <SelectContent className="rounded-2xl border-border/50">
            <SelectItem value="all">All Talukas</SelectItem>
            {talukas.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
