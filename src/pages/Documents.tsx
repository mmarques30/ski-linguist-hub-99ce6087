import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FileText, Download, Upload, Search, Eye, Trash2, FolderOpen } from "lucide-react";

interface Document {
  id: string;
  name: string;
  category: string;
  type: string;
  size: string;
  uploadedAt: string;
  downloads: number;
}

const documentCategories = [
  {
    name: "FIFPL Funding",
    description: "Documents related to FIFPL funding criteria and processes",
    count: 3,
  },
  {
    name: "Reimbursement Tutorials",
    description: "Step-by-step guides for reimbursement requests",
    count: 2,
  },
  {
    name: "Micro-Enterprise Info",
    description: "Information about micro-enterprise support tranches",
    count: 1,
  },
  {
    name: "Certificates",
    description: "CFP attestations and language certificates",
    count: 4,
  },
];

const mockDocuments: Document[] = [
  {
    id: "DOC-001",
    name: "Critères de prise en charge Moniteurs de ski 2026",
    category: "FIFPL Funding",
    type: "PDF",
    size: "245 KB",
    uploadedAt: "2026-01-05",
    downloads: 156,
  },
  {
    id: "DOC-002",
    name: "Tutorial de como fazer o pedido de reembolso",
    category: "Reimbursement Tutorials",
    type: "DOCX",
    size: "1.2 MB",
    uploadedAt: "2026-01-03",
    downloads: 89,
  },
  {
    id: "DOC-003",
    name: "Courrier informatif sur les tranches de prise en charge",
    category: "Micro-Enterprise Info",
    type: "PDF",
    size: "178 KB",
    uploadedAt: "2026-01-02",
    downloads: 67,
  },
  {
    id: "DOC-004",
    name: "Comment télécharger l'attestation CFP",
    category: "Certificates",
    type: "PDF",
    size: "523 KB",
    uploadedAt: "2026-01-01",
    downloads: 234,
  },
];

export default function Documents() {
  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Documents</h1>
            <p className="text-muted-foreground">
              Manage informational documents and resources for students
            </p>
          </div>
          <Button>
            <Upload className="mr-2 h-4 w-4" />
            Upload Document
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search documents..." className="pl-10" />
        </div>

        {/* Categories */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {documentCategories.map((category) => (
            <Card key={category.name} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <FolderOpen className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{category.name}</CardTitle>
                    <Badge variant="secondary" className="mt-1">
                      {category.count} files
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>{category.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Document List */}
        <Card>
          <CardHeader>
            <CardTitle>All Documents</CardTitle>
            <CardDescription>
              Browse and manage all uploaded documents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {mockDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between py-4 hover:bg-muted/50 -mx-4 px-4 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="rounded-lg bg-muted p-2">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{doc.name}</p>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span>{doc.category}</span>
                        <span>{doc.type}</span>
                        <span>{doc.size}</span>
                        <span>{doc.downloads} downloads</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
