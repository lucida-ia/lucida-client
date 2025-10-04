import { Upload } from "lucide-react";
import { Button } from "./button";
import { Card, CardContent } from "./card";

interface UploadAreaProps {
  isDragging: boolean;
  handleDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  handleDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
  handleDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  handleFileInput: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
}

const UploadArea = ({
  isDragging,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  handleFileInput,
  disabled = false,
}: UploadAreaProps) => {
  return (
    <Card>
      <CardContent className="pt-4 md:pt-6">
        <label
          htmlFor="file-upload"
          className={`block w-full ${
            disabled ? "cursor-not-allowed" : "cursor-pointer"
          }`}
        >
          <div
            role="button"
            tabIndex={disabled ? -1 : 0}
            aria-label={
              disabled
                ? "Upload disabled"
                : "Drop files here or click to select files"
            }
            className={`rounded-apple border-2 border-dashed p-6 md:p-10 apple-transition ${
              disabled
                ? "border-apple-gray-4/50 bg-apple-gray-6/50 opacity-60"
                : isDragging
                ? "border-apple-blue bg-apple-blue/5"
                : "border-apple-gray-4"
            }`}
            onClick={
              disabled
                ? undefined
                : () => document.getElementById("file-upload")?.click()
            }
            onKeyDown={
              disabled
                ? undefined
                : (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      document.getElementById("file-upload")?.click();
                    }
                  }
            }
            onDragOver={disabled ? undefined : handleDragOver}
            onDragLeave={disabled ? undefined : handleDragLeave}
            onDrop={disabled ? undefined : handleDrop}
          >
            <div className="flex flex-col items-center justify-center space-y-4 md:space-y-6 text-center">
              <Upload className="h-12 w-12 md:h-16 md:w-16 text-apple-blue" />
              <div className="space-y-2 md:space-y-3">
                <h3 className="text-headline md:text-title-3 font-semibold text-foreground">
                  Arraste e solte seu material
                </h3>
                <p className="text-subhead text-muted-foreground px-2">
                  Faça upload de múltiplos arquivos PDF, DOC, DOCX ou TXT
                </p>
                <p className="text-footnote text-muted-foreground px-2">
                  Limites: até ≈ 375.000 palavras no total
                </p>
              </div>
              <div>
                <label htmlFor="file-upload">
                  <Button
                    type="button"
                    variant="tinted"
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
                    disabled={disabled}
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
