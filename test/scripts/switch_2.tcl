set x ONE
set y 1
set z ONE

# Note that patterns are not subject to substitutions if
# contained in braces

switch $x {
    $z {
        set y1 [expr {$y+1}]
        puts "MATCH \$z. $y + $z is $y1"
    }
    ONE {
        set y1 [expr {$y+1}]
        puts "MATCH ONE. $y + one is $y1"
    }
    TWO {
        set y1 [expr {$y+2}]
        puts "MATCH TWO. $y + two is $y1"
    }
    THREE {
        set y1 [expr {$y+3}]
        puts "MATCH THREE. $y + three is $y1"
    }
    default {
        puts "$x is NOT A MATCH"
    }
}