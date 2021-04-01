import pyvips

slide_directory = 'test_slides/'
slide_files = ['sampleSlideTwo.svs']

output_directory = 'test_dzi/'

for files in slide_files:
    img = pyvips.Image.new_from_file(slide_directory + files, access='sequential')
    img.dzsave(output_directory + files[0 : -4])
