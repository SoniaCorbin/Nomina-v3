package com.nomina.desktop.service;

import java.io.IOException;
import java.util.List;

import com.fasterxml.jackson.core.type.TypeReference;
import com.nomina.desktop.model.AuthMe;
import com.nomina.desktop.model.Category;
import com.nomina.desktop.model.CategoryInput;
import com.nomina.desktop.model.Concept;
import com.nomina.desktop.model.ConceptInput;
import com.nomina.desktop.model.Culture;
import com.nomina.desktop.model.CultureInput;
import com.nomina.desktop.model.TotalResponse;
import com.nomina.desktop.model.UniversThematique;
import com.nomina.desktop.model.UniversThematiqueInput;

public class ApiService {
    private final ApiClient apiClient;

    public ApiService() {
        this.apiClient = new ApiClient();
    }

    public AuthMe checkMe() throws IOException, InterruptedException {
        String raw = apiClient.request("GET", "/auth/me", null, true);
        return apiClient.getObjectMapper().readValue(raw, AuthMe.class);
    }

    public List<Concept> getConcepts() throws IOException, InterruptedException {
        String raw = apiClient.request("GET", "/concepts", null, false);
        return apiClient.getObjectMapper().readValue(raw, new TypeReference<>() {});
    }

    public Concept createConcept(ConceptInput input) throws IOException, InterruptedException {
        String raw = apiClient.request("POST", "/concepts", input, true);
        return apiClient.getObjectMapper().readValue(raw, Concept.class);
    }

    public Concept updateConcept(int id, ConceptInput input) throws IOException, InterruptedException {
        String raw = apiClient.request("PUT", "/concepts/" + id, input, true);
        return apiClient.getObjectMapper().readValue(raw, Concept.class);
    }

    public void deleteConcept(int id) throws IOException, InterruptedException {
        apiClient.request("DELETE", "/concepts/" + id, null, true);
    }

    public int getConceptTotal() throws IOException, InterruptedException {
        String raw = apiClient.request("GET", "/concepts/total", null, false);
        return apiClient.getObjectMapper().readValue(raw, TotalResponse.class).total;
    }

    public int getCultureTotal() throws IOException, InterruptedException {
        String raw = apiClient.request("GET", "/cultures/total", null, false);
        return apiClient.getObjectMapper().readValue(raw, TotalResponse.class).total;
    }

    public int getCategorieTotal() throws IOException, InterruptedException {
        String raw = apiClient.request("GET", "/categories/total", null, false);
        return apiClient.getObjectMapper().readValue(raw, TotalResponse.class).total;
    }

    public int getUniversTotal() throws IOException, InterruptedException {
        String raw = apiClient.request("GET", "/univers/total", null, false);
        return apiClient.getObjectMapper().readValue(raw, TotalResponse.class).total;
    }

    public List<Category> getCategories() throws IOException, InterruptedException {
        String raw = apiClient.request("GET", "/categories", null, false);
        return apiClient.getObjectMapper().readValue(raw, new TypeReference<>() {});
    }

    public Category createCategory(CategoryInput input) throws IOException, InterruptedException {
        String raw = apiClient.request("POST", "/categories", input, true);
        return apiClient.getObjectMapper().readValue(raw, Category.class);
    }

    public Category updateCategory(int id, CategoryInput input) throws IOException, InterruptedException {
        String raw = apiClient.request("PUT", "/categories/" + id, input, true);
        return apiClient.getObjectMapper().readValue(raw, Category.class);
    }

    public void deleteCategory(int id) throws IOException, InterruptedException {
        apiClient.request("DELETE", "/categories/" + id, null, true);
    }

    public List<Culture> getCultures() throws IOException, InterruptedException {
        String raw = apiClient.request("GET", "/cultures", null, false);
        return apiClient.getObjectMapper().readValue(raw, new TypeReference<>() {});
    }

    public Culture createCulture(CultureInput input) throws IOException, InterruptedException {
        String raw = apiClient.request("POST", "/cultures", input, true);
        return apiClient.getObjectMapper().readValue(raw, Culture.class);
    }

    public Culture updateCulture(int id, CultureInput input) throws IOException, InterruptedException {
        String raw = apiClient.request("PUT", "/cultures/" + id, input, true);
        return apiClient.getObjectMapper().readValue(raw, Culture.class);
    }

    public void deleteCulture(int id) throws IOException, InterruptedException {
        apiClient.request("DELETE", "/cultures/" + id, null, true);
    }

    public List<UniversThematique> getUnivers() throws IOException, InterruptedException {
        String raw = apiClient.request("GET", "/univers", null, false);
        return apiClient.getObjectMapper().readValue(raw, new TypeReference<>() {});
    }

    public UniversThematique createUnivers(UniversThematiqueInput input) throws IOException, InterruptedException {
        String raw = apiClient.request("POST", "/univers", input, true);
        return apiClient.getObjectMapper().readValue(raw, UniversThematique.class);
    }

    public UniversThematique updateUnivers(int id, UniversThematiqueInput input) throws IOException, InterruptedException {
        String raw = apiClient.request("PUT", "/univers/" + id, input, true);
        return apiClient.getObjectMapper().readValue(raw, UniversThematique.class);
    }

    public void deleteUnivers(int id) throws IOException, InterruptedException {
        apiClient.request("DELETE", "/univers/" + id, null, true);
    }
}
