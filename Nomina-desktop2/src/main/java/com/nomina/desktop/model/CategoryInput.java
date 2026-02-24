package com.nomina.desktop.model;

public class CategoryInput {
    private String name;
    private String description;
    private Integer universId;
    private String universName;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Integer getUniversId() {
        return universId;
    }

    public void setUniversId(Integer universId) {
        this.universId = universId;
    }

    public String getUniversName() {
        return universName;
    }

    public void setUniversName(String universName) {
        this.universName = universName;
    }
}
