import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewEncapsulation
} from '@angular/core';
import * as d3 from 'd3';
import {Selection} from 'd3-selection';
import {ConnectionState, RoleType} from 'mitosis';
import {Edge, Node} from 'mitosis-simulation';
import {filter} from 'rxjs/operators';
import {LayoutChangeTypes, LayoutService} from '../../../shared/services/layout';
import {D3Model} from './models/d3';

@Component({
  selector: 'app-d3-directed-graph',
  templateUrl: './d3-directed-graph.html',
  styleUrls: ['./d3-directed-graph.scss'],
  encapsulation: ViewEncapsulation.None
})
export class D3DirectedGraphComponent implements OnInit, AfterViewInit, OnChanges {
  @Input()
  public model: D3Model;

  @Output()
  public selectedNodeChange: EventEmitter<Node>;

  private margin: {
    top: number,
    right: number,
    bottom: number,
    left: number
  } = {top: 20, right: 20, bottom: 30, left: 40};
  private width;
  private height;
  private svg: Selection<any, any, any, any>;
  private zoomHolder: Selection<any, any, any, any>;
  private simulation: any;
  private zoomHandler: any;
  private nodeColor = '#ccc';
  private selectedNode: Node;

  constructor(private el: ElementRef, private layoutService: LayoutService) {
    this.selectedNodeChange = new EventEmitter();
  }

  private dragstarted(d: any) {
    if (!d3.event.active) {
      this.simulation.alphaTarget(0.3).restart();
    }
    d.fx = d.x;
    d.fy = d.y;
  }

  private dragged(d: any) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
  }

  private dragended(d: any) {
    if (!d3.event.active) {
      this.simulation.alphaTarget(0).restart();
    }
    d.fx = null;
    d.fy = null;
  }

  private zoomActions() {
    this.zoomHolder.attr('transform', d3.event.transform);
  }

  private tick() {
    const links = d3.select('.links').selectAll('.link');
    const nodes = d3.select('.nodes').selectAll('.node');

    links
      .attr('x1', (d: any) => {
        return d.source.x;
      })
      .attr('y1', (d: any) => {
        return d.source.y;
      })
      .attr('x2', (d: any) => {
        return d.target.x;
      })
      .attr('y2', (d: any) => {
        return d.target.y;
      })
      .attr('stroke-dasharray', (d: Edge): any => {
        if (d.getConnection().isInState(ConnectionState.CLOSING, ConnectionState.CLOSED)) {
          return [2, 8];
        } else if (d.getConnection().isInState(ConnectionState.OPENING)) {
          return [8, 8];
        } else {
          return [0];
        }
      })
      .attr('stroke', (d: Edge) => {
        if (this.selectedNode && d.getConnection().getAddress().getId() === this.selectedNode.getId()) {
          return 'blue';
        } else if (d.getConnection().isInState(ConnectionState.OPENING, ConnectionState.CLOSING)) {
          return 'rgba(100,100,100,0.3)';
        } else {
          return 'rgba(100,100,100,0.6)';
        }
      });

    nodes
      .attr('transform', (d: Node) => {
        return 'translate(' + d.x + ',' + d.y + ')';
      });

    nodes
      .select('circle')
      .attr('fill', (d: Node) => {
        const roles = d.getMitosis().getRoleManager().getRoles();

        if (roles.indexOf(RoleType.SIGNAL) >= 0) {
          return 'red';
        } else if (roles.indexOf(RoleType.ROUTER) >= 0) {
          return 'green';
        } else {
          return '#ccc';
        }
      })
      .attr('stroke', (d: Node) => {
        if (d.isSelected()) {
          return 'blue';
        } else {
          return 'white';
        }
      });
  }

  private initD3() {
    const holderEl = this.el.nativeElement.querySelector('.d3-directed-graph');
    holderEl.innerHTML = '';

    this.svg = d3.select(holderEl)
      .append('svg')
      .attr('width', this.width)
      .attr('height', this.height - 5);

    this.zoomHolder = this.svg
      .append('g')
      .attr('class', 'zoom-holder-el');

    this.simulation = d3.forceSimulation()
      .force('collide',
        d3.forceCollide(30)
          .iterations(2))
      .force('link',
        d3.forceLink()
          .id((d: any) => d.getId())
          .distance(50)
          .strength(0.4)
      )
      .force('charge', d3.forceManyBody())
      .force('x', d3.forceX(this.width / 2))
      .force('y', d3.forceY(this.height / 2))
      .on('tick', this.tick.bind(this));

    this.zoomHandler = d3.zoom()
      .on('zoom', this.zoomActions.bind(this));

    this.zoomHandler(this.svg);

    this.zoomHolder.append('g')
      .attr('class', 'links')
      .selectAll('link');

    this.zoomHolder.append('g')
      .attr('class', 'nodes')
      .selectAll('.node');
  }

  private update() {

    let node = d3.select('.nodes').selectAll('.node');
    node = node.data(this.model.getNodes(), (d: Node) => d.getId());

    const nodeHolder = node
      .enter()
      .append('g')
      .attr('class', 'node');

    nodeHolder
      .append('circle')
      .attr('r', (d: any) => {
        return 10;
      })
      .attr('fill', this.nodeColor)
      .on('click', (d: Node) => {
        this.selectNode(d.getId());
      });

    nodeHolder
      .call(d3.drag()
        .on('start', this.dragstarted.bind(this))
        .on('drag', this.dragged.bind(this))
        .on('end', this.dragended.bind(this)));

    nodeHolder
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dx', (d: any) => {
        return 0;
      })
      .attr('font-size', (d: any) => {
        return '12px';
      })
      .attr('dy', '.35em')
      .text((d: Node) => {
        return d.getId();
      });

    node.exit()
      .remove();

    let link = d3.select('.links').selectAll('.link');
    link = link.data(this.model.getEdges(), (d: Edge) => d.getId());

    link
      .enter()
      .append('line')
      .attr('class', 'link')
      .attr('stroke-width', (d: any) => {
        return '2';
      });

    link.exit()
      .remove();

    this.simulation
      .nodes(this.model.getNodes());

    this.simulation
      .force('link')
      .links(this.model.getEdges());

    if (!node.enter().empty() || !node.exit().empty()) {
      this.simulation.alphaTarget(0.3).restart();
    } else {
      this.simulation.alphaTarget(0).restart();
    }
  }

  private resize() {
    this.svg.attr('width', 0);
    this.svg.attr('height', 0);
    setTimeout(() => {
      this.width = this.el.nativeElement.offsetWidth;
      this.height = this.el.nativeElement.offsetHeight;
      this.svg.attr('width', this.width);
      this.svg.attr('height', this.height - 5);
      this.simulation
        .force('x', d3.forceX(this.width / 2))
        .force('y', d3.forceY(this.height / 2));
    });
  }

  public selectNode(nodeId: string) {
    let selectedNode: Node;
    d3.selectAll('.node').each((d: Node) => {
      if (!selectedNode && d.getId().match(nodeId)) {
        selectedNode = d;
      }
      if (d.isSelected()) {
        d.setSelected(false);
      }
    });

    if (selectedNode) {
      selectedNode.setSelected(true);
      this.selectedNode = selectedNode;
      this.selectedNodeChange.emit(selectedNode);
    } else {
      this.selectedNode = null;
      this.selectedNodeChange.emit(null);
    }
  }

  ngOnInit(): void {
    this.layoutService.getObservable()
      .pipe(
        filter(ev => ev.changeType === LayoutChangeTypes.windowSizeChange)
      )
      .subscribe(
        this.resize.bind(this)
      );
  }

  ngAfterViewInit(): void {
    this.width = this.el.nativeElement.offsetWidth;
    this.height = this.el.nativeElement.offsetHeight;
    this.initD3();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.model.currentValue && this.width) {
      this.update();
    }
  }
}
