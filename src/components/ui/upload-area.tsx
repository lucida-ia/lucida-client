import { Upload } from "lucide-react";
import { Button } from "./button";
import { Card, CardContent } from "./card";

interface UploadAreaProps {
  isDragging: boolean;
  handleDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  handleDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
  handleDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  handleFileInput: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const UploadArea = ({
  isDragging,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  handleFileInput,
}: UploadAreaProps) => {
  return (
    <Card>
      <CardContent className="pt-4 md:pt-6">
        <label htmlFor="file-upload" className="block w-full cursor-pointer">
          <div
            role="button"
            tabIndex={0}
            aria-label="Drop files here or click to select files"
            className={`rounded-lg border-2 border-dashed p-6 md:p-10 transition-all duration-200 ${
              isDragging
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25"
            }`}
            onClick={() => document.getElementById("file-upload")?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                document.getElementById("file-upload")?.click();
              }
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center justify-center space-y-3 md:space-y-4 text-center">
              <Upload className="h-10 w-10 md:h-12 md:w-12 text-muted-foreground" />
              <div className="space-y-1 md:space-y-2">
                <h3 className="text-lg md:text-xl font-semibold">
                  Arraste e solte seu material
                </h3>
                <p className="text-sm text-muted-foreground px-2">
                  Faça upload de múltiplos arquivos PDF, DOC, DOCX ou TXT
                </p>
                <p className="text-xs text-muted-foreground px-2">
                  Limites: até 100MB por arquivo • até 500.000 tokens no total
                </p>
              </div>
              <div>
                <label htmlFor="file-upload">
                  <Button
                    type="button"
                    variant="outline"
                    className="cursor-pointer touch-manipulation"
                    size="default"
                  >
                    Selecionar material
                  </Button>
                  <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={handleFileInput}
                    multiple
                  />
                </label>
              </div>
            </div>
          </div>
        </label>
      </CardContent>
    </Card>
  );
};

export default UploadArea;
