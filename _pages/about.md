<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      margin: 0;
      font-family: Arial, Helvetica, sans-serif;
    }

    .header {
      text-align: center;
      padding: 32px;
    }

    .menu {
      overflow: hidden;
      background-color: #333;
    }

    .menu a {
      float: left;
      display: block;
      color: white;
      text-align: center;
      padding: 14px 16px;
      text-decoration: none;
    }

    .menu a:hover {
      background-color: #111;
    }

    .main {
      padding: 16px;
      margin-top: 30px;
      height: 1500px; /* Used in this example to enable scrolling */
    }

    .section {
      height: 400px;
      width: 100%;
    }

    .section1 {
      background-image: url('https://picsum.photos/200/300');
      background-attachment: fixed;
      background-position: center;
      background-repeat: no-repeat;
      background-size: cover;
    }

    .section2 {
      background-image: url('https://picsum.photos/200/300');
      background-attachment: fixed;
      background-position:center ;
      background-repeat:no-repeat ;
      background-size :cover ;
    }

    .section3 {
      background-image:url('https://picsum.photos/200/300') ;
      background-attachment :fixed ;
      background-position:center ;
      background-repeat:no-repeat ;
      background-size :cover ;
    }

    .section4 {
      background-image:url('https://picsum.photos/200/300') ;
      background-attachment :fixed ;
      background-position:center ;
      background-repeat:no-repeat ;
      background-size :cover ;
    }
  </style>
</head>
<body>

<div class="header">
  <h1>My Website</h1>
  <p>Scroll down to see the fixed/sticky background effect.</p>
</div>

<div class="menu">
  <a href="#section1">Section 1</a>
  <a href="#section2">Section 2</a>
  <a href="#section3">Section 3</a>
  <a href="#section4">Section 4</a>
</div>

<div class="main">
  <div id="section1" class="section section1">
    <h2>About Me</h2>
    <p>I am a Computational Biologist with experience in Genomic data analysis, having worked at [University of Bern](https://www.unibe.ch/index_eng.html) and the latest at [EPFL](https://www.epfl.ch/en/).</p>
    <p>My main interests are Biology, Bioinformatics, Biostatistics, Metabolism, Programming, Nutrition, and Sports. I focused on improving my skills to give the best support in my job.</p>
  </div>
  
  <div id="section2" class="section section2">
    <h2>My Tools</h2>
    <ul>
        <li>Python</li>
        <li>Sci-kit</li>
        <li>R</li>
        <li>Shiny</li>
        <li>Jupyter</li>
        <li>Cytoscape</li>
        <li>Linux</li>
        <li>Slurm</li>
        <li>Adobe</li>
     </ul>
   </div>

   <div id="section3" class="section section3">
     <h2>Hobbies and Interests</h2>
     <p>I love being in Nature and having time for my hobbies.</p>
   </div>

   <div id="section4" class="section section4">
     <h2>Contact Me</h2>
     <p>If any questions, I am happy to answer through any social platform or email, see in Contact!</p>
     <p>Have a nice day!</p>
   </div>

</div>

</body>
</html>
