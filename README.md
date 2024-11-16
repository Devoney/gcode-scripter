### Purpose of GCode Scripter
This is meant as a utility to generate gcode. Gcode in itself are merely instructions of course and loops and all have be written out in full. 

This typescript lib should make it easier to work with variables, loops and conditions (basically every advantage of programming) that simple gcode interpreters (such as mach3/4) do not support.

Its first use was for a CNC milling machine with 4 axis (XYZ and A)

### Code
The GcodeWriter is the fundamental class in this repo.
It currently supports linear and rotary movement.
Currently it does not support the combination of both though adding this shouldn't be difficult.
The coordinate system used currently is absolute. Although adding relative movements
should be difficult too.


### Examples
There is an example program in main.ts. It contains some Dutch so it was easier for my son to read along too. The `Stok` class is like a rod, circumference/diameter and length.

### Disclaimer
It is strongly adviced to read through the outputted gcode, checking the limits on all axes for instance, before actually running it on your machine. There is no guarantee the functionality offered is bug free.