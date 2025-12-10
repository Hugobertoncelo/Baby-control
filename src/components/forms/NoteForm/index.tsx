"use client";

import React, { useState, useEffect, useRef } from "react";
import { NoteResponse } from "@/app/api/types";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import { DateTimePicker } from "@/src/components/ui/date-time-picker";
import {
  FormPage,
  FormPageContent,
  FormPageFooter,
} from "@/src/components/ui/form-page";
import { ChevronDown } from "lucide-react";
import { useTimezone } from "@/app/context/timezone";
import { useTheme } from "@/src/context/theme";
import { useToast } from "@/src/components/ui/toast";
import { handleExpirationError } from "@/src/lib/expiration-error-handler";
import "./note-form.css";

interface NoteFormProps {
  isOpen: boolean;
  onClose: () => void;
  babyId: string | undefined;
  initialTime: string;
  activity?: NoteResponse;
  onSuccess?: () => void;
}

export default function NoteForm({
  isOpen,
  onClose,
  babyId,
  initialTime,
  activity,
  onSuccess,
}: NoteFormProps) {
  const { formatDate, toUTCString } = useTimezone();
  const { theme } = useTheme();
  const { showToast } = useToast();
  const [selectedDateTime, setSelectedDateTime] = useState<Date>(() => {
    try {
      const date = new Date(initialTime);
      if (isNaN(date.getTime())) {
        return new Date();
      }
      return date;
    } catch (error) {
      console.error("Error parsing initialTime:", error);
      return new Date();
    }
  });
  const [formData, setFormData] = useState({
    time: initialTime,
    content: "",
    category: "",
  });
  const [categories, setCategories] = useState<string[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [initializedTime, setInitializedTime] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/note?categories=true");
        if (!response.ok) throw new Error("Falha ao buscar categorias");
        const data = await response.json();
        if (data.success) {
          setCategories(data.data);
          setFilteredCategories(data.data);
        }
      } catch (error) {
        console.error("Erro ao buscar categorias:", error);
      }
    };

    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  useEffect(() => {
    if (formData.category.trim() === "") {
      setFilteredCategories(categories);
      setDropdownOpen(false);
    } else {
      const filtered = categories.filter((category) =>
        category.toLowerCase().includes(formData.category.toLowerCase())
      );
      setFilteredCategories(filtered);
    }
  }, [formData.category, categories]);

  const handleDateTimeChange = (date: Date) => {
    setSelectedDateTime(date);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    const formattedTime = `${year}-${month}-${day}T${hours}:${minutes}`;
    setFormData((prev) => ({ ...prev, time: formattedTime }));
  };

  useEffect(() => {
    if (isOpen && !isInitialized) {
      if (activity) {
        try {
          const activityDate = new Date(activity.time);
          if (!isNaN(activityDate.getTime())) {
            setSelectedDateTime(activityDate);
          }
        } catch (error) {
          console.error("Error parsing activity time:", error);
        }

        const date = new Date(activity.time);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        const formattedTime = `${year}-${month}-${day}T${hours}:${minutes}`;

        setFormData({
          time: formattedTime,
          content: activity.content,
          category: activity.category || "",
        });
      } else {
        try {
          const date = new Date(initialTime);
          if (!isNaN(date.getTime())) {
            setSelectedDateTime(date);

            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, "0");
            const day = String(date.getDate()).padStart(2, "0");
            const hours = String(date.getHours()).padStart(2, "0");
            const minutes = String(date.getMinutes()).padStart(2, "0");
            const formattedTime = `${year}-${month}-${day}T${hours}:${minutes}`;

            setFormData((prev) => ({ ...prev, time: formattedTime }));
          }
        } catch (error) {
          console.error("Error parsing initialTime:", error);
        }

        setInitializedTime(initialTime);
      }

      setIsInitialized(true);
    } else if (!isOpen) {
      setIsInitialized(false);
      setInitializedTime(null);
    }
  }, [isOpen, activity, initialTime]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!babyId) return;

    if (!formData.content) {
      console.error("Required fields missing: content");
      return;
    }

    if (!selectedDateTime || isNaN(selectedDateTime.getTime())) {
      console.error("Required fields missing: valid date time");
      return;
    }

    setLoading(true);

    try {
      const utcTimeString = toUTCString(selectedDateTime);

      console.log("Original time (local):", formData.time);
      console.log("Converted time (UTC):", utcTimeString);

      const payload = {
        babyId,
        time: utcTimeString,
        content: formData.content,
        category: formData.category || null,
      };

      const authToken = localStorage.getItem("authToken");

      const response = await fetch(
        `/api/note${activity ? `?id=${activity.id}` : ""}`,
        {
          method: activity ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: authToken ? `Bearer ${authToken}` : "",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        if (response.status === 403) {
          const { isExpirationError, errorData } = await handleExpirationError(
            response,
            showToast,
            "salvando notas"
          );
          if (isExpirationError) {
            return;
          }
          if (errorData) {
            showToast({
              variant: "error",
              title: "Erro",
              message: errorData.error || "Falha ao salvar a nota",
              duration: 5000,
            });
            throw new Error(errorData.error || "Falha ao salvar a nota");
          }
        }

        const errorData = await response.json();
        showToast({
          variant: "error",
          title: "Erro",
          message: errorData.error || "Falha ao salvar a nota",
          duration: 5000,
        });
        throw new Error(errorData.error || "Falha ao salvar a nota");
      }

      onClose();
      onSuccess?.();

      setSelectedDateTime(new Date(initialTime));
      setFormData({
        time: initialTime,
        content: "",
        category: "",
      });
    } catch (error) {
      console.error("Error saving note:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySelect = (category: string) => {
    setFormData((prev) => ({ ...prev, category }));
    setDropdownOpen(false);
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  };

  const handleCategoryInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, category: value }));

    setHighlightedIndex(-1);

    if (value.trim() !== "") {
      setDropdownOpen(true);
    }
  };

  const handleCategoryInputFocus = () => {
    if (formData.category.trim() !== "") {
      setDropdownOpen(true);
    }
  };

  const handleCategoryKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!dropdownOpen) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        setDropdownOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredCategories.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredCategories.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (
          highlightedIndex >= 0 &&
          highlightedIndex < filteredCategories.length
        ) {
          handleCategorySelect(filteredCategories[highlightedIndex]);
        } else if (formData.category.trim() !== "") {
          handleCategorySelect(formData.category.trim());
        }
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
        break;
      case "Escape":
        e.preventDefault();
        setDropdownOpen(false);
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
        break;
      default:
        break;
    }
  };

  return (
    <FormPage
      isOpen={isOpen}
      onClose={onClose}
      title={activity ? "Editar Nota" : "Adicionar Nota"}
      description={
        activity
          ? "Atualize sua nota sobre seu bebê"
          : "Registre uma nota sobre seu bebê"
      }
    >
      <FormPageContent>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="form-label">Hora</label>
              <DateTimePicker
                value={selectedDateTime}
                onChange={handleDateTimeChange}
                disabled={loading}
                placeholder="Selecione a hora da nota..."
              />
            </div>

            <div>
              <label className="form-label">Categoria</label>
              <div className="relative">
                <div className="relative w-full">
                  <div className="flex items-center w-full">
                    <Input
                      ref={inputRef}
                      value={formData.category}
                      onChange={handleCategoryInputChange}
                      onFocus={handleCategoryInputFocus}
                      onKeyDown={handleCategoryKeyDown}
                      className="w-full pr-10 note-form-dropdown-trigger"
                      placeholder="Digite ou selecione uma categoria"
                      disabled={loading}
                    />
                    <ChevronDown
                      className="absolute right-3 h-4 w-4 text-gray-500 note-form-dropdown-icon"
                      onClick={() => {
                        setDropdownOpen(!dropdownOpen);
                        if (document.activeElement instanceof HTMLElement) {
                          document.activeElement.blur();
                        }
                      }}
                    />
                  </div>

                  {dropdownOpen && (
                    <div
                      ref={dropdownRef}
                      className="absolute z-50 w-full mt-1 bg-white rounded-md shadow-lg border border-gray-200 max-h-60 overflow-auto category-dropdown-container"
                      style={{ width: inputRef.current?.offsetWidth }}
                    >
                      {filteredCategories.length > 0 ? (
                        <div className="py-1">
                          {filteredCategories.map((category, index) => (
                            <div
                              key={category}
                              className={`px-3 py-2 text-sm cursor-pointer category-dropdown-item ${
                                highlightedIndex === index
                                  ? "bg-gray-100 category-dropdown-item-highlighted"
                                  : "hover:bg-gray-100"
                              }`}
                              onClick={() => handleCategorySelect(category)}
                              onMouseEnter={() => setHighlightedIndex(index)}
                            >
                              {category}
                            </div>
                          ))}
                        </div>
                      ) : formData.category.trim() !== "" ? (
                        <div className="px-3 py-2 text-sm text-gray-500 category-dropdown-no-match">
                          Nenhuma categoria correspondente. Pressione Enter para
                          criar "{formData.category}".
                        </div>
                      ) : (
                        <div className="px-3 py-2 text-sm text-gray-500 category-dropdown-no-categories">
                          Nenhuma categoria encontrada
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div>
              <label className="form-label">Nota</label>
              <Textarea
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                className="w-full min-h-[150px]"
                placeholder="Digite sua nota"
                required
                disabled={loading}
              />
            </div>
          </div>
        </form>
      </FormPageContent>
      <FormPageFooter>
        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {activity ? "Atualizar" : "Salvar"}
          </Button>
        </div>
      </FormPageFooter>
    </FormPage>
  );
}
