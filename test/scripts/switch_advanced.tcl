proc doSwitch {bar} {
    switch -regexp -matchvar foo -indexvar ah -- $bar {
        a(b*)c {
            puts "Found [lindex $foo 1]"
            puts [lindex $ah]
        }
        d(e*)f(g*)h {
            puts "Found [lindex $foo 1] and\
                    [lindex $foo 2]"
        }
    }
}

set bar abbbc
doSwitch $bar
set bar defgggggh
doSwitch $bar
