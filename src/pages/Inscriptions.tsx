import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Filter, Download, Plus, Eye, Edit, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Inscription {
  id: string;
  name: string;
  email: string;
  phone: string;
  skiSchool: string;
  language: string;
  level: string;
  modality: string;
  duration: string;
  funding: string;
  status: "pending" | "confirmed" | "active" | "completed" | "cancelled";
  createdAt: string;
}

const statusStyles = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-blue-100 text-blue-800",
  active: "bg-emerald-100 text-emerald-800",
  completed: "bg-gray-100 text-gray-800",
  cancelled: "bg-red-100 text-red-800",
};

const mockInscriptions: Inscription[] = [
  {
    id: "INS-001",
    name: "Jean-Pierre Dubois",
    email: "jp.dubois@esf.fr",
    phone: "+33 6 12 34 56 78",
    skiSchool: "ESF Val d'Isère",
    language: "English",
    level: "A2",
    modality: "In-person",
    duration: "20h",
    funding: "OPCO",
    status: "pending",
    createdAt: "2026-01-08",
  },
  {
    id: "INS-002",
    name: "Marie Laurent",
    email: "m.laurent@esf.fr",
    phone: "+33 6 98 76 54 32",
    skiSchool: "ESF Courchevel",
    language: "Portuguese",
    level: "B1",
    modality: "Online",
    duration: "15h",
    funding: "Self-funded",
    status: "confirmed",
    createdAt: "2026-01-07",
  },
  {
    id: "INS-003",
    name: "Pierre Martin",
    email: "p.martin@esf.fr",
    phone: "+33 6 11 22 33 44",
    skiSchool: "ESF Méribel",
    language: "Russian",
    level: "A1",
    modality: "In-person",
    duration: "12h",
    funding: "FIFPL",
    status: "active",
    createdAt: "2026-01-06",
  },
  {
    id: "INS-004",
    name: "Sophie Bernard",
    email: "s.bernard@esf.fr",
    phone: "+33 6 55 66 77 88",
    skiSchool: "ESF Les Arcs",
    language: "Dutch",
    level: "B2",
    modality: "In-person",
    duration: "18h",
    funding: "Company",
    status: "completed",
    createdAt: "2026-01-05",
  },
];

export default function Inscriptions() {
  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Inscriptions</h1>
            <p className="text-muted-foreground">
              Manage student registrations and applications
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              New Inscription
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 rounded-lg border bg-card p-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or school..."
                className="pl-10"
              />
            </div>
          </div>
          <Select defaultValue="all">
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="all">
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Languages</SelectItem>
              <SelectItem value="english">English</SelectItem>
              <SelectItem value="portuguese">Portuguese</SelectItem>
              <SelectItem value="russian">Russian</SelectItem>
              <SelectItem value="dutch">Dutch</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="all">
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Funding" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Funding</SelectItem>
              <SelectItem value="opco">OPCO</SelectItem>
              <SelectItem value="fifpl">FIFPL</SelectItem>
              <SelectItem value="company">Company</SelectItem>
              <SelectItem value="self">Self-funded</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        {/* Table */}
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Ski School</TableHead>
                <TableHead>Language</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Funding</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockInscriptions.map((inscription) => (
                <TableRow key={inscription.id}>
                  <TableCell className="font-mono text-sm">
                    {inscription.id}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{inscription.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {inscription.email}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>{inscription.skiSchool}</TableCell>
                  <TableCell>{inscription.language}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{inscription.level}</Badge>
                  </TableCell>
                  <TableCell>{inscription.duration}</TableCell>
                  <TableCell>{inscription.funding}</TableCell>
                  <TableCell>
                    <Badge className={cn(statusStyles[inscription.status], "hover:opacity-80")}>
                      {inscription.status.charAt(0).toUpperCase() + inscription.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>{inscription.createdAt}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing 1-4 of 4 inscriptions
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled>
              Next
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
