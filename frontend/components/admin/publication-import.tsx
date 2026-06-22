"use client";

import { Upload } from "lucide-react";
import { type ChangeEvent, useState } from "react";
import { SiOrcid } from "react-icons/si";
import { toast } from "sonner";
import type { ReloadProps } from "@/components/admin/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { api, type ImportResult } from "@/lib/client";

export function PublicationImport({ reload }: ReloadProps) {
  const [bibtex, setBibtex] = useState("");
  const [orcid, setOrcid] = useState("");
  const [doi, setDoi] = useState("");
  const [busy, setBusy] = useState(false);

  function report(result: ImportResult) {
    if (result.created === 0) {
      toast.info(`Nothing imported — ${result.skipped} already existed or were empty.`);
    } else {
      toast.success(`Imported ${result.created} publication(s); skipped ${result.skipped}.`);
    }
  }

  async function run(fn: () => Promise<ImportResult>, onDone?: () => void) {
    setBusy(true);
    try {
      report(await fn());
      onDone?.();
      await reload();
    } catch (e) {
      toast.error(String(e));
    } finally {
      setBusy(false);
    }
  }

  function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) file.text().then(setBibtex);
    e.target.value = "";
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import publications</CardTitle>
        <CardDescription>
          Bulk-add from a BibTeX file or an ORCID record. Duplicates (by DOI or title) are skipped.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="bibtex">
          <TabsList>
            <TabsTrigger value="bibtex">BibTeX</TabsTrigger>
            <TabsTrigger value="orcid">ORCID</TabsTrigger>
            <TabsTrigger value="doi">DOI</TabsTrigger>
          </TabsList>

          <TabsContent value="bibtex" className="space-y-3">
            <Textarea
              rows={6}
              placeholder="Paste BibTeX entries here, or load a .bib file…"
              value={bibtex}
              onChange={(e) => setBibtex(e.target.value)}
              className="field-sizing-fixed max-h-[50vh] resize-y font-mono text-xs"
            />
            <div className="flex items-center gap-2">
              <Button asChild variant="outline" size="sm">
                <label>
                  <Upload className="size-4" /> Load .bib file
                  <input type="file" accept=".bib,.txt" className="hidden" onChange={onFile} />
                </label>
              </Button>
              <Button
                size="sm"
                disabled={busy || !bibtex.trim()}
                onClick={() =>
                  run(
                    () => api.importBibtex(bibtex),
                    () => setBibtex(""),
                  )
                }
              >
                Import BibTeX
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="orcid" className="space-y-3">
            <Label htmlFor="orcid-id">ORCID iD</Label>
            <div className="flex gap-2">
              <Input
                id="orcid-id"
                placeholder="0000-0000-0000-0000"
                value={orcid}
                onChange={(e) => setOrcid(e.target.value)}
                className="max-w-56"
              />
              <Button
                disabled={busy || !orcid.trim()}
                onClick={() =>
                  run(
                    () => api.importOrcid(orcid.trim()),
                    () => setOrcid(""),
                  )
                }
              >
                <SiOrcid className="size-4" /> Import from ORCID
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Pulls the public works list; author lists are filled in from Crossref where a DOI is
              available.
            </p>
          </TabsContent>

          <TabsContent value="doi" className="space-y-3">
            <Label htmlFor="doi-id">DOI</Label>
            <div className="flex gap-2">
              <Input
                id="doi-id"
                placeholder="10.1038/nature14539"
                value={doi}
                onChange={(e) => setDoi(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" &&
                  doi.trim() &&
                  run(
                    () => api.importDoi(doi.trim()),
                    () => setDoi(""),
                  )
                }
                className="max-w-72 font-mono text-sm"
              />
              <Button
                disabled={busy || !doi.trim()}
                onClick={() =>
                  run(
                    () => api.importDoi(doi.trim()),
                    () => setDoi(""),
                  )
                }
              >
                Look up DOI
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Fetches title, authors, venue, and year from Crossref for a single DOI.
            </p>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
