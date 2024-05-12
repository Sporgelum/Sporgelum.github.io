---
layout: archive
title: "Projects"
permalink: /projects/
author_profile: true
---

{% include base_path %}

## Overview

This page provides an overview of various projects that involve data gathering, cleaning, integration and analysis. The projects primarily focus on RNA-seq, scSeq, snSeq and computing resources. They were executed using different libraries in Python and R among others.

## Projects

### Data Gathering

This phase involves extracting datasets and information from databases containing transcriptomics information. The databases include [SRA](https://www.ncbi.nlm.nih.gov/sra/), [GEO](https://www.ncbi.nlm.nih.gov/geo/), [ENA](https://www.ebi.ac.uk/ena), [dbGAP](https://www.ncbi.nlm.nih.gov/gap/), [Census](https://cellxgene.cziscience.com/), etc.

### Data Cleaning

Data cleaning is a crucial step in the analysis. It involves filtering the information to ensure the best structure and quality for later biological questions. Quality checks are essential steps that will influence the future of the analysis.

### Integration of Multi-Sample Datasets

This project involves integrating Single-cell-RNA-seq and Single-nuclei-RNA-seq data using neural network structures for dimensionality reduction and further downstream analysis processing. Data representation and embedding tuning are performed using UMAP, PYMDE, PCA, K-Means, and other techniques.

### RNA-seq 

#### Comparisons of RNA-seq Data from *Danio rerio* Heart Injury Models

This project involves establishing a workflow to analyze the RNA-seq of heart injury models publicly available. The goal is to understand the biological differences that the injury models of interest effect on the regeneration capabilities of Zebrafish and adds information to the genes obtained after the analysis. The biological interpretation is aided by multiple visualizations such as Integrated Networks realized with Gene Ontologies. The R code files used for this analysis can be found on <a href="[https://github.com/MercaderLabAnatomy/PUB_Botos_et_al_2022]">GitHub</a>.

<!---   <img alt="alt_text" width="1920px" height="1080px" src="/images/Figure1_corrected_Shape_and_Index_v4.png" /> -->


#### Small RNA-seq Species Data from *Danio rerio* Analysis

This project involves establishing a pipeline to capture the micro, piwi, tRNA, rRNA, and more available annotation species in Ensembl, NCBI, and other resources to add species to the established workflow.

<!---   <img alt="alt_text" width="1920px" height="1080px" src="/images/Networks_4.5_3_Injuries.png"/> -->


#### Variant Calling for RNA-seq Data from *Danio rerio* for Capturing the Haplotypes Involved in Metabolic Disturbances

This project involves performing variant calling and exploring the genes involved in the energy supply to understand metabolic disturbances believed to arise from variants affecting the mitochondrion.

### scSeq and snSeq

#### Adipose Tissue

##### Single-Cell and Single-Nuclei RNA-seq Integration of Adipose Tissue Samples

This project involves extracting samples from either stromal vascular fractions (SVF) or full adipose tissue of Omental and Subcutaneous in Human and Mouse.

##### sc/sn RNA-seq Based Deconvolution of Sequenced Disease Associated RNA-seq Cohorts 

This project involves using the reference above for deconvolution of RNA-seq cohorts affected by Diabetes or Obesity to analyze if there is a correlation between disease and cell type.

##### Paired Single Cell-RNA-seq and Single Nuclei-ATAC-seq in Mouse of Specific Adipose Precursor Cell Type

This project involves using paired RNA and DNA accessibility data to investigate the relationship between gene expression and DNA accessibility, as well as identify the genes involved in the specific dataset. The data will be analyzed using various techniques, including default mapping and remapping of the accessibility regions using MACS2, following the guidelines per cluster to improve accuracy. The integrated analysis will be performed using MultiVI, a tool framework based on neural networks, to uncover associations between cell expression and DNA accessibility.

#### Immunology

##### scSeq Data Integration of Multiple Non-Model Organism at Using Different Data Origins such as Blood, PBMC or Lymph Node

This project involves establishing a workflow for reference genome building, mapping of the raw fastq files, quality checking, processing, and integration. It is applied to multiple species to decipher the composition similarities of the Mononuclear Phagocyte System (MPS) in the tissues above mentioned. The species include Bovine, Horse, Porcine, Canine, Human, and Mouse.

### Computing Resources

This projects involves computing resources that are obtained via connection to remote resources "Cluster based".

The resources are managed via SLURM in Linux based clusters that allow working with Python and R interactively via VSCode or RStudio(Posit).

The tools used include FASTQC, MultiQ, Cutadap, STAR, CellRanger, BWA, Samtools, Seurat(R), Scanpy(Python), scVI(Python), clusterProfiler, GSEA, GO, KEGG, decoupleR, Census, Celltypist, and many more for customized visualization and analysis from raw to end.


### Shiny Web Apps

This project involves the development of web applications, designed for interactive data visualization and downloading. The web applications are customizable, versatile, secure, and based on the R programming language. An example can be found <a href="[https://github.com/MercaderLabAnatomy/PUB_Botos_et_al_2022]">here</a>.

### Fun Projects

This project involves a face emotion recognition mini-project "for fun" to test and set up local resources (GPU, SDD, and RAM).
