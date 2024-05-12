---
layout: archive
title: "Projects"
permalink: /projects/
author_profile: true
---

{% include base_path %}



### Data Gathering

  - Extracting datasets and information from databases containing transcriptomics information such as SRA, GEO, ENA, dbGAP, Census.

### Data Cleaning

  - Filtering the information that represents the best structure and quality to be used for later biological questions.
  - Quality checks are essential steps that will influence the future of the analysis. 


### Integration of multi-sample datasets

- Single-cell-RNA-seq and Single-nuclei-RNA-seq data Integration using neural network structures for dimensionality reduction and further downstream analysis processing.
- Data representation and embedding tuning using UMAP, PYMDE, PCA, K-Means...

The projects were executed using different libraries in Python.



### RNA-seq 

## Comparisons of RNA-seq data from *Danio rerio* heart injury models

Workflow established to analyze the RNA-seq of heart injury models publicly available. Looking into the biological differences that the injury models of interest effect on the regeneration capabilities of Zebrafish and adds information to the genes (data of interest) obtained after the analysis.

<!---   <img alt="alt_text" width="1920px" height="1080px" src="/images/Figure1_corrected_Shape_and_Index_v4.png" /> -->



Biological Interpretation is helped by multiple visualizations such as Integrated Networks realized with Gene Ontologies.

<!---   <img alt="alt_text" width="1920px" height="1080px" src="/images/Networks_4.5_3_Injuries.png"/> -->


The *R* code files that were used for this analysis will be found on <a href="[https://github.com/j](https://github.com/MercaderLabAnatomy/PUB_Botos_et_al_2022)">GitHub</a>.


## small RNA-seq species data from *Danio rerio* analysis

Establishment of a pipeline to capture the micro, piwi, tRNA, rRNA, and more available annotation species in Ensembl, NCBI and other resources to add species to the workflow established.



## Variant Calling for RNA-seq data from *Danio rerio* for capturing the Haplotypes involved in metabolic disturbances

Metabolic disturbances are believed to arise from variants affecting the mitochondrion in charge of the energy supply of the cell and altering completely the organism. This was analyzed by performing variant calling and exploring the genes involved in the energy supply.


### scSeq and snSeq

- **Adipose Tissue**

## Single-cell and single-nuclei RNA-seq integration of Adipose Tissue samples

  - Samples were extracted either stromal vascular fractions(SVF) or full adipose tissue of Omental and Subcutaneous in Human and Mouse.

    
## sc/sn RNA-seq based deconvolution of sequenced disease associatted RNA-seq cohorts 

  - Reference above was used for deconvolution of RNA-seq cohorts affected by Diabetes or Obesity to analyze if there is a correlation between disease and celltype.


## paired single cell-RNA-seq and single nuclei-ATAC-seq in Mouse of specific Adipose Precursor cell type

  - Using paired RNA and DNA accessibility  allows to look at the genetic and how is the expression paired to the accessibility and which genes are involved in the specific dataset.

- **Immunology**

## scSeq data integration of multiple non-model organism at using different data origins such as blood, PBMC or lymph node

  - Establishment of Workflow:
      + reference genome building
      + mapping of the raw fastq files
      + Quality checking
      + Processing
      + Integration
   
  - Applied to multiple species to decipher the composition similarities of the Mononuclear Phagocyte System (MPS) in the tissues above mentioned
      + Bovine
      + Horse
      + Porcine
      + Canine
      + Human
      + Mouse
        



## Computing Resources
Established connection to remote resources "Cluster based" for data processing.

- Combining resources managed via SLURM in Linux based clusters that allow to be working with Python and R  and to be used interactively via VSCode or RStudio(Posit)
    + VSCode
        * Python
        * R
          
    + SLURM
    + Bash
    + Anaconda

  - Tools used:
    + FASTQC
    + MultiQ
    + Cutadap
    + STAR
    + CellRanger
    + BWA
    + Samtools
  - For further processing:
    + Seurat(R)
    + Scanpy(Python)
    + scVI(Python)
    + clusterPorfiler
    + GSEA, GO, KEGG,
    + decoupleR, Census, Celltypist, etc...

* many more for customized visualization and analysis from raw to end.

## Shiny web apps

Development of web applications, designed for interactive data visualization and downloading.
The web applications are customizable, versatile, secure, and based on the R programming language.
<a href="https://marius-alex.shinyapps.io/MitacoRa">Example (requires password and user)</a>

### Fun projects

- Face emotion recognition mini-project "for fun" to test and set up my local resources (GPU, SDD, and RAM).
